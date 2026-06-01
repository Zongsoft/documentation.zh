---
description: 使用 hosting 仓库中的 Podman 文件准备 Redis、数据库和文件服务。
icon: boxes-stacked
---

# 容器化环境

hosting 仓库提供 Podman 容器文件，用于启动本地开发依赖服务。

## 容器文件

- `zongsoft.pod-host.yaml`
- `zongsoft.pod-redis.yaml`
- `zongsoft.pod-rustfs.yaml`
- `zongsoft.pod-mysql.yaml`
- `zongsoft.pod-postgres.yaml`

## 启停脚本

```text
zongsoft.pod(start).cmd
zongsoft.pod(stop).cmd
```

这些脚本会交互式询问要启动或停止的服务名。

## 服务地址

容器之间访问其它服务时，通常使用 Pod 名作为网络地址：

| Pod 名 | 服务 |
| --- | --- |
| `zongsoft.caching` | Redis |
| `zongsoft.data` | MySQL / PostgreSQL |
| `zongsoft.io` | RustFS |

## Windows 注意事项

Windows 环境建议确认 WSL 2 可用。如果 WSL 网络处于 mirrored 模式导致容器互通异常，可以参考 hosting README 中的网络模式说明切换到 NAT。
