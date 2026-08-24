# Smart HRMS

A role-based Human Resource Management System with Node.js/Express + MySQL backend, FastAPI AI service, and a professional React/Vite frontend.

## Project structure

- `Backend/` — Express API, Sequelize models/migrations, authentication, attendance, leave, payroll, audit logs and AI gateway.
- `Ai-service/` — FastAPI assistant service.
- `Frontend/` — React/Vite Smart HRMS UI with role-aware navigation, dashboards, profile, leave, attendance, payroll, AI assistant and developer section.

## Run backend

```powershell
cd Backend
npm install
npm start
```

Backend defaults to `http://localhost:5000`.

## Run frontend

```powershell
cd Frontend
npm install
npm run dev
```

Frontend defaults to the Vite development URL shown in the terminal. It calls `http://localhost:5000/api` by default. To change it, copy `Frontend/.env.example` to `Frontend/.env` and set `VITE_API_URL`.

## Run AI service (optional)

```powershell
cd Ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set `FASTAPI_URL=http://localhost:8000` in the backend environment when using the FastAPI service.

## Developer section

The frontend contains a static Developer page. Update the `developer` object in `Frontend/src/App.jsx` and replace `Frontend/public/developer-placeholder.svg` with the final developer image when ready.

## Security

Environment files containing secrets are intentionally not included in the distributable project archive. Use the provided `.env.example` files to recreate local configuration.

## Important first-run database step

After configuring MySQL, run the migrations and seeders:

```powershell
cd Backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

If you are upgrading an existing Smart HRMS database, the migration
`20260824100000-sync-seeded-identity-data.js` repairs the original seeded
identity mapping so the seeded employee email and login email are identical,
usernames follow `employee-first-name.role`, and Karna is the ADMIN account.
Existing password hashes are preserved.

## Creating a new employee login

Admin and HR can create an employee from **Employees → Add employee**. The form
now requires the initial password and login role. The backend creates the
employee and login account in one database transaction, so a half-created
employee cannot be left behind.

- Login email = employee email
- Username = employee first name + role, for example `rahul.employee`, `vikram.manager`
- Password = the initial password entered during creation
- HR can create EMPLOYEE or MANAGER accounts; only ADMIN can create HR/ADMIN accounts
- A reporting manager can be assigned during creation so manager leave approvals work correctly

Changing an employee's name/email or changing an account's role keeps the login
username/email synchronized with the employee identity.

## Dashboard design

Admin, HR and Manager now use separate role-specific command-center dashboards
with role-specific shortcuts, statistics, workflow diagrams, thought of the day,
attendance/leave activity, priorities and (for Admin) an organization command map.
Employees retain the personal self-service dashboard.
