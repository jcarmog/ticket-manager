# Ticket Manager

A full-stack ticket management application built with Angular and Java (Jakarta EE with Spring).

## Project Structure

```text
ticket-manager/
├── frontend/     # Angular 17.3.0 application
├── backend/      # Java backend with Jakarta EE and Spring
└── README.md
````

## Technology Stack

### Frontend

- **Framework**: Angular 17.3.0
- **Language**: TypeScript 5.4.2
- **UI Components**: PrimeNG 17.18.15
- **Styling**:
    - TailwindCSS 3.4.18
    - PrimeIcons 7.0.0
- **Rich Text Editor**: Quill 2.0.3
- **State Management**: RxJS 7.8.0

### Backend

- **Java SDK**: 21
- **Framework**: Jakarta EE with Spring
- **ORM**: Spring Data JPA
- **Web**: Spring MVC
- **Database**: MySQL
- **Utilities**: Lombok

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Java JDK 21**
- **Maven** (for backend build)
- **Podman** or **Docker** (for database container)

## Database Setup

### 1\. Start MySQL Container

```bash
podman run -d --name mysql-ticket-manager \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=ticket_manager \
  -p 3306:3306 \
  mysql:latest
```

### 2\. Verify Database Users

Check existing MySQL users:

```bash
podman exec mysql-ticket-manager mysql -u root -proot -e "SELECT User, Host FROM mysql.user;"
```

### 3\. Configure Remote Access

Allow root user to connect from any host:

```bash
podman exec mysql-ticket-manager mysql -u root -proot -e "UPDATE mysql.user SET Host='%' WHERE User='root'; FLUSH PRIVILEGES;"
```

### Alternative: Using Docker

If you're using Docker instead of Podman, replace `podman` with `docker` in all commands above.

## Getting Started

### Frontend Setup

1.  Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm start
    ```

4.  Open your browser and navigate to `http://localhost:4200`

### Backend Setup

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Build the project:

    ```bash
    mvn clean install
    ```

3.  Run the application:

    ```bash
    mvn spring-boot:run
    ```

## Development

### Frontend Development

- **Development Server**: `npm start` or `ng serve`
- **Build**: `npm run build`
- **Run Tests**: `npm test`

### Backend Development

- **Run**: `mvn spring-boot:run`
- **Build**: `mvn clean install`
- **Run Tests**: `mvn test`

## Building for Production

### Frontend

```bash
cd frontend
npm run build --configuration production
```

### Backend

```bash
cd backend
mvn clean package
```

## Database Management

### Stop Database Container

```bash
podman stop mysql-ticket-manager
```

### Start Existing Container

```bash
podman start mysql-ticket-manager
```

### Connect to Database Shell

```bash
podman exec -it mysql-ticket-manager mysql -u root -proot ticket_manager
```

`````

---

### Key Fixes Applied:
* **Project Structure:** Formatted the directory tree into a text code block so it displays vertically instead of on a single line.
* **Podman Commands:** Fixed the `podman run` command to use line continuation backslashes (`\`). This makes the command copy-pasteable without errors.
* **Code Fences:** Enclosed all plain text commands (lines starting with `bash cd...`) inside proper Markdown code blocks (```` ```bash ````) for syntax highlighting.
* **Cleanup:** Removed the "The README.md file has been created..." sentence from the end of the document.

Would you like me to add a section on **Environment Variables** or **Troubleshooting** common connection errors to this file?
`````