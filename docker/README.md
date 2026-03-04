# Docker 使用说明

本目录用于构建并运行 `xiaoheifs` 后端服务。

## 目录结构

- `build/Dockerfile`：镜像构建文件
- `build/start.sh`：容器启动脚本（根据环境变量生成 `app.config.yaml`）
- `build/build-docker-image.sh`：手动构建镜像脚本
- `docker-compose/docker-compose.mysql.yaml`：MySQL 部署（默认推荐）
- `docker-compose/docker-compose.postgres.yaml`：PostgreSQL 部署
- `docker-compose/docker-compose.sqlite.yaml`：SQLite 部署（仅开发测试）

## 1. 构建镜像

在仓库根目录执行：

```bash
./docker/build/build-docker-image.sh
```

指定镜像名：

```bash
./docker/build/build-docker-image.sh your-registry/xiaoheifs-backend:tag
```

## 2. 启动服务

默认（MySQL）：

```bash
docker compose -f docker/docker-compose/docker-compose.mysql.yaml up -d --build
```

PostgreSQL：

```bash
docker compose -f docker/docker-compose/docker-compose.postgres.yaml up -d --build
```

SQLite（仅开发/测试）：

```bash
docker compose -f docker/docker-compose/docker-compose.sqlite.yaml up -d --build
```

警告：SQLite 不建议用于生产环境。

## 3. 停止与清理

停止并删除容器：

```bash
docker compose -f docker/docker-compose/docker-compose.mysql.yaml down
```

连同数据卷一起删除（会清空数据库）：

```bash
docker compose -f docker/docker-compose/docker-compose.mysql.yaml down -v
```

## 4. 关键环境变量（写在 compose 中）

后端容器：

- `APP_ADDR`
- `APP_API_BASE_URL`
- `APP_JWT_SECRET`
- `APP_PLUGIN_MASTER_KEY`
- `APP_PLUGINS_DIR`
- `APP_DB_TYPE`
- `APP_DB_PATH`
- `APP_DB_HOST`
- `APP_DB_PORT`
- `APP_DB_NAME`
- `APP_DB_USER`
- `APP_DB_PASSWORD`
- `APP_DB_OPTIONS`

数据库容器：

- MySQL：`MYSQL_ROOT_PASSWORD` / `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD`
- PostgreSQL：`POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`

## 5. 查看日志

```bash
docker compose -f docker/docker-compose/docker-compose.mysql.yaml logs -f xiaoheifs
```
