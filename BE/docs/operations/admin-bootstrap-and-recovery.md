# First Admin bootstrap and Admin recovery

**Decision A-23: resolved.** The team approved a one-time CLI bootstrap. This page is the operator guide for it, and for the separate recovery procedure used when no Admin can sign in.

Both procedures are for operators with access to the server and the database. Neither is available through the HTTP API.

## 1. First Admin bootstrap

### What it does

`bootstrap-admin` creates the first `TRAINING_ADMIN`, then exits. It never runs at application startup, and there is no registration endpoint.

| Situation | Result |
|---|---|
| Any `TRAINING_ADMIN` row exists, active or not | Refused before any input is requested. Exit code 1 |
| No `TRAINING_ADMIN` exists | Asks for the details, creates one Admin. Exit code 0 |
| Two operators run it at the same time | A PostgreSQL advisory lock serialises them; the second sees the first Admin and is refused |
| No interactive terminal (piped input, CI, some IDE consoles) | Refused. Exit code 2 |
| Database or startup failure | Nothing created. Exit code 3 |

In one transaction it takes the advisory lock, checks again that no Admin exists, validates the input with the TR01 rules, stores a BCrypt hash made by the application's `PasswordEncoder`, and writes `USER_CREATE` to `app_security_log` with `details = {userId, role, source: "CLI_BOOTSTRAP"}`. The log entry never contains the password or its hash.

Input rules are TR01's: username 4-50 characters of `a-z 0-9 . _`; a valid email; full name up to 255 characters; password 8-64 characters with upper case, lower case and a digit (and at most 72 bytes).

### How to run it

1. Build the application: `./mvnw package` (in `BE/`).
2. Point it at the target database with the usual variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. `JWT_SECRET` is not needed for this command.
3. Run it in a real terminal:

   ```
   java -jar target/training-management-backend-0.0.1-SNAPSHOT.jar bootstrap-admin
   ```

   Spring arguments can follow the command name, for example `--spring.datasource.url=...`. Never pass the database password as an argument; use `DB_PASSWORD`.
   On Windows, use PowerShell or Windows Terminal. Git Bash (mintty) does not provide a console to Java; prefix the command with `winpty` there.
4. Answer the prompts. The password is typed twice without echo, then you confirm with `yes`.
5. Sign in with the new account. The spec has no forced password change; the holder can change it through `PATCH /api/v1/auth/password`.

Like a normal start, the command applies pending Flyway migrations to the target database.

### Credentials

- The password is entered only at the prompt. It is never accepted from arguments, environment variables or files, and it is never printed or logged.
- Hand the credentials to the designated Admin holder through the organisation's approved secret channel. Who that holder is, is an organisational assignment recorded outside this repository.

## 2. Recovery when no Admin can sign in

Use this only when **no Admin can sign in at all**. It is deliberately separate from the bootstrap: the bootstrap refuses whenever any Admin row exists, and that refusal must not be bypassed.

### First, rule out the normal paths

| Situation | Action |
|---|---|
| Another Admin can sign in | Not a recovery. That Admin uses `PATCH /users/{id}/status` (unlocks and clears the failed-login counters) or `PATCH /users/{id}/password` |
| The only Admins are temporarily locked after 5 failed logins | Wait: the lock ends after 15 minutes (D03) |
| No `TRAINING_ADMIN` row exists at all | Not a recovery. Run the bootstrap (section 1) |
| Admin rows exist, but every one is inactive, or no holder knows a password | Use the procedure below |

### Preconditions

- A change or incident ticket, approved by the system owner and a second person (four-eyes).
- A current database backup.
- The operator connects to the intended database as its owner and checks `SELECT current_database();` before changing anything.

### Procedure

1. Choose one existing Admin account to restore, normally the designated holder's:

   ```sql
   SELECT id, username, is_active, locked_until
   FROM users WHERE role = 'TRAINING_ADMIN' ORDER BY id;
   ```

2. On the operator's machine, generate a BCrypt hash of a new temporary password that meets the TR01 rules, without typing the password on a command line, for example `htpasswd -nBC 10 admin | cut -d: -f2` (it prompts). Never store the password or the hash in a file, ticket or repository.

3. In `psql`, with the hash, the account id and the ticket number held in psql variables (`\set`), apply the change and its audit entries in one transaction:

   ```sql
   BEGIN;

   UPDATE users
   SET password_hash = :'new_hash',
       is_active = TRUE,
       failed_login_count = 0,
       locked_until = NULL,
       token_version = token_version + 1,   -- revokes every existing session of this account
       updated_at = now()
   WHERE id = :admin_id AND role = 'TRAINING_ADMIN';
   -- Must report UPDATE 1. Otherwise: ROLLBACK;

   INSERT INTO app_security_log (action, username, ip_address, details)
   SELECT a.action, u.username, NULL,
          jsonb_build_object('userId', u.id, 'source', 'OPERATOR_RECOVERY', 'ticket', :'ticket')
   FROM users u
   CROSS JOIN (VALUES ('USER_STATUS_CHANGE'), ('PASSWORD_CHANGE')) AS a(action)
   WHERE u.id = :admin_id;

   COMMIT;
   ```

   Only existing actions from spec 0.6 are used. The entries hold no credential.

4. Give the temporary password to the holder through the approved secret channel. The holder signs in and immediately changes it with `PATCH /api/v1/auth/password`, which revokes the temporary session too.
5. Close the ticket with the time, the account id, both approvers and the two log entry ids.

### Never

- Delete Admin rows so that the bootstrap runs again. That destroys history, and `created_by` and other references usually prevent it anyway.
- Change the bootstrap's "any Admin exists" check, or add an HTTP path for this.
- Commit a password, hash or ticket secret to Git, or paste one into chat or logs.
