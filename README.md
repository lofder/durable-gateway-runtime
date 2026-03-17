# Durable Gateway Runtime

> Public-facing architecture notes and experimental implementation.  
> 面向公开仓库的架构设想文档与实验性实现。
>
> Start here / 从这里开始: [Public Architecture Concept: Multi-Channel Gateway and Execution Model](docs/architecture/ingress-execution-skeleton-concept.md)

## Overview / 项目概览

This repository contains a work-in-progress web application and a set of public architecture notes for discussion.

本仓库包含一个仍在演进中的 Web 应用，以及一组适合公开讨论的架构文档。

The public documents intentionally use generic terminology and omit sensitive operational details.

公开文档会刻意使用通用称呼，并隐去不适合放入公共仓库的敏感实现与运维细节。

## Architecture Notes / 架构文档

- `docs/architecture/ingress-execution-skeleton-concept.md`  
  Public bilingual concept note for a multi-channel gateway and execution model.  
  面向开源讨论的双语版“多渠道网关与执行模型”架构设想文档。

## Public Scope / 开源说明

- This repository may contain conceptual architecture material, not only finalized implementation details.
- Terminology in public docs is generalized on purpose.
- The architecture may evolve as the implementation matures.

- 本仓库中的部分内容属于架构设想，不完全等同于最终线上实现。
- 公开文档中的术语经过有意泛化处理。
- 随着实现推进，架构设计也可能继续演进。

## Development / 本地开发

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

在浏览器中打开 `http://localhost:3000` 即可查看本地运行效果。

## Tech Stack / 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS

## Contributing / 贡献说明

Issues and pull requests are welcome for public discussion, architecture review, and implementation improvements.

欢迎通过 Issue 和 Pull Request 参与公开讨论、架构评审与实现改进。
