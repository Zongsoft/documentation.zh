---
description: 使用仓库 Podman 清单准备开发依赖，识别端口、挂载和持久化边界。
icon: boxes-stacked
---

# 容器化环境

hosting 仓库的 Podman 清单主要用于准备开发和验证依赖。清单包含服务端口、初始化脚本及本地挂载路径，使用前应按自己的工作区和数据保存需求检查；它们不等同于经过完整运维设计的生产集群。

## 现有清单

| 清单 | Pod 名 | 用途 |
| --- | --- | --- |
| `zongsoft.pod-host.yaml` | `zongsoft` | 开发/构建宿主环境及工作区挂载 |
| `zongsoft.pod-redis.yaml` | `zongsoft.caching` | Redis |
| `zongsoft.pod-etcd.yaml` | `zongsoft.distributed` | etcd，映射 2379 |
| `zongsoft.pod-mysql.yaml` | `zongsoft.data` | MySQL，映射 3306 |
| `zongsoft.pod-postgres.yaml` | `zongsoft.data` | PostgreSQL，映射 5432 |
| `zongsoft.pod-rustfs.yaml` | `zongsoft.io` | S3 兼容存储 |

MySQL 与 PostgreSQL 清单使用相同 Pod 名，不应未经检查把它们当成可同时独立启动的两套环境。需要共存时，应由环境方案明确资源命名和网络组织。

## 启动前检查

先查看清单中的 hostPath 是否存在、初始化 SQL 是否来自预期仓库、端口是否被占用，再检查凭据与数据卷。数据库初始化挂载不等于数据库数据目录持久化；当前 etcd 清单没有持久卷，不应保存需要跨重建保留的数据。

`zongsoft.pod(start).cmd` 和 `zongsoft.pod(stop).cmd` 会询问服务选择。执行前读对应脚本，确认操作目标；停止容器、删除 Pod 和删除数据卷是不同操作，不能一概理解为无损重启。

## 地址从哪里看

Windows 上运行的宿主通常通过映射到主机的端口访问服务，例如 `127.0.0.1:2379`。容器内的 `localhost` 指向自身；跨 Pod 访问要确认所在网络、名称解析和服务监听地址，不能只根据一个 Pod 名保证可达。

{% code title="InspectPods.ps1" %}
```powershell
podman ps --all --pod
podman pod ps
```
{% endcode %}

这些只读命令用于查看状态。进程 Running 不等于数据库已完成初始化，应继续检查对应容器日志或服务就绪探测，再启动依赖它的插件。

## Windows 与 WSL

Windows 的 Podman 运行环境依赖相应虚拟化和网络配置。出现地址不可达时，先区分端口映射、DNS、代理、防火墙及 WSL 网络，再参考 hosting README 的环境说明。不要把切换 mirrored/NAT 当作所有问题的固定修复步骤。

挂载源码时还要考虑宿主与容器的路径形式、权限、大小写及换行符。Linux 下脚本可执行位和正确 LF 也会影响运行。

## 与应用交付的关系

开发容器用于复现依赖，应用镜像交付则需要额外安排配置注入、数据卷、健康检查、日志和版本发布。精简容器通常不包含 systemd，不能直接假定[进程外升级器](../framework/upgrading/workflow.md)的服务重启路径可用。

源码入口：[Podman 清单与脚本](https://github.com/Zongsoft/hosting)、[环境说明](https://github.com/Zongsoft/hosting/blob/main/README.zh-Hans.md)。
