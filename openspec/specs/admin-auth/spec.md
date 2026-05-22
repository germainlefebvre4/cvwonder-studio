# Spec: admin-auth

## Purpose

Defines how the admin interface authenticates users and protects admin routes. The system uses credential-based login (username + password verified against environment variables) and issues a signed session cookie for subsequent requests. All `/api/admin/*` routes except `/api/admin/login` require a valid session.

## Requirements

### Requirement: Admin login with username and password
The system SHALL authenticate an admin via a login form accepting `username` and `password`. Credentials SHALL be verified using bcrypt comparison against `ADMIN_PASSWORD_HASH` and `ADMIN_USERNAME` environment variables. On success the system SHALL issue an HMAC-SHA256 signed session token stored in an HttpOnly, Secure, SameSite=Strict cookie named `admin_session` with an 8-hour expiry.

#### Scenario: Successful login
- **WHEN** admin submits valid username and password to `POST /api/admin/login`
- **THEN** system returns HTTP 200 and sets `admin_session` cookie with signed token

#### Scenario: Invalid credentials
- **WHEN** admin submits incorrect username or password to `POST /api/admin/login`
- **THEN** system returns HTTP 401 with no cookie set

#### Scenario: Missing credentials
- **WHEN** admin submits request to `POST /api/admin/login` with missing username or password field
- **THEN** system returns HTTP 400

### Requirement: Admin session validation on protected routes
The system SHALL validate the `admin_session` cookie on every request to `/api/admin/*` routes (except `/api/admin/login`). An invalid, expired, or missing token SHALL result in a 401 response. A valid token SHALL allow the request to proceed.

#### Scenario: Request with valid session cookie
- **WHEN** client sends request to a protected admin route with a valid `admin_session` cookie
- **THEN** system processes the request and returns the appropriate response

#### Scenario: Request with expired session cookie
- **WHEN** client sends request to a protected admin route with an expired `admin_session` cookie
- **THEN** system returns HTTP 401

#### Scenario: Request with no session cookie
- **WHEN** client sends request to a protected admin route without an `admin_session` cookie
- **THEN** system returns HTTP 401

#### Scenario: Request with tampered session cookie
- **WHEN** client sends request to a protected admin route with a cookie whose HMAC signature does not verify
- **THEN** system returns HTTP 401

### Requirement: Admin logout
The system SHALL provide a logout endpoint at `POST /api/admin/logout` that clears the `admin_session` cookie by setting it to an empty value with `MaxAge=0`.

#### Scenario: Logout clears cookie
- **WHEN** admin sends request to `POST /api/admin/logout`
- **THEN** system returns HTTP 200 and sets `admin_session` cookie with `MaxAge=0`

### Requirement: Admin login page redirect
The React SPA SHALL redirect unauthenticated users who access any `/admin/*` route (except `/admin/login`) to `/admin/login`. After successful login the user SHALL be redirected to the originally requested URL or `/admin/dashboard` if none.

#### Scenario: Unauthenticated access to admin route
- **WHEN** user navigates to `/admin/dashboard` without a valid session
- **THEN** SPA redirects user to `/admin/login`

#### Scenario: Redirect after login
- **WHEN** user successfully logs in after being redirected from `/admin/themes`
- **THEN** SPA redirects user to `/admin/themes`
