## Blueprint SQL

This project has one purpose -> startup project with all things configured, like: 

- Typescript
- Linting
- Github Hooks
- Testing
- Database connection
- Containerization
- Monitoring Tools
- Good Practices implemented

![Alt text](image.png)

### Development

In order to be able to run the project you will need NodeJS and NPM installed.

Prerequisites: 
- Node & NPM - https://nodejs.org/en/learn/getting-started/how-to-install-nodejs
- Docker

Tips&Tricks: Install `nvm` (Node Version Manager)

#### BE

```shell
nvm install 14 && cd BE && npm i
```

#### ngx-admin

```shell
nvm install 16 && cd BE && npm i
```

#### DB

The Database is Postgres and it is in Docker container 

```shell
docker-compose up
```

