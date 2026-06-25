# 

 Docker  Solqora 

> 📖 [](https://docs.solqora.pro/zh/docs/installation/deployment-methods/bt-docker-installation)

***

## 

|     |                                  |
| ----- | ---------------------------------- |
|   | ≥ 9.2.0                          |
|   | CentOS 7+Ubuntu 18.04+Debian 10+ |
|  |  1  2G                        |

***

## 

1.  [](https://www.bt.cn/new/download.html) 
2. 
3. 

***

##  Docker

1.  **Docker**
2.  Docker  ****
3.  Docker 

***

##  Solqora

### 

1.  Docker  ****
2.  **New-API**
3.  ****
4. 
   - **** `solqora-core`
   - **** `3000:3000`
   - ****
     - `SESSION_SECRET`****
     - `CRYPTO_SECRET` Redis 
5.  **** 
6.  `http://IP:3000` 

###  Docker Compose

1.  `/www/wwwroot/solqora-core`
2.  `docker-compose.yml` 

```yaml
version: '3'
services:
  solqora-core:
    image: calciumion/solqora-core:latest
    container_name: solqora-core
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - SESSION_SECRET=your_session_secret_here  # 
      - TZ=Asia/Shanghai
```

1. 

```bash
cd /www/wwwroot/solqora-core
docker-compose up -d
```

***

## 

### 

|                  |                  |    |
| ------------------- | ------------------ | ------ |
| `SESSION_SECRET`    |       | **** |
| `CRYPTO_SECRET`     |  Redis   |    |
| `SQL_DSN`           |  |      |
| `REDIS_CONN_STRING` | Redis         |      |

### 

```bash
#  SESSION_SECRET
openssl rand -hex 16

#  Linux 
head -c 16 /dev/urandom | xxd -p
```

***

## 

### Q1 3000 

1.  3000 
2.  ****  3000 
3. 

### Q2

 `SESSION_SECRET` 

### Q3

 Docker 

```yaml
volumes:
  - ./data:/data
```

### Q4

```bash
# 
docker pull calciumion/solqora-core:latest

# 
docker-compose down && docker-compose up -d
```

***

## 

- [](https://docs.solqora.pro/zh/docs/installation)
- [](https://docs.solqora.pro/zh/docs/installation/config-maintenance/environment-variables)
- [](https://docs.solqora.pro/zh/docs/support/faq)
- [GitHub ](https://github.com/solqora/solqora-core)

***

## 

![ Docker ](https://github.com/user-attachments/assets/7a6fc03e-c457-45e4-b8f9-184508fc26b0)

> ⚠️  `SESSION_SECRET`

