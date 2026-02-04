# @repo/logger

Logger compartilhado do monorepo DentAI Pro. Wrapper leve sobre `console` com níveis de log padronizados.

## Instalação

```typescript
import { logger } from '@repo/logger';
```

## Uso

```typescript
import { logger } from '@repo/logger';

logger.debug('Dados de debug', { context: 'example' });
logger.info('Operação realizada com sucesso');
logger.warn('Atenção: recurso deprecado');
logger.error('Falha ao processar requisição', error);
logger.log('Alias para info');
```

## API

| Método | Nível | Descrição |
|--------|-------|-----------|
| `logger.debug()` | DEBUG | Informações de debug |
| `logger.info()` | INFO | Informações gerais |
| `logger.warn()` | WARN | Avisos |
| `logger.error()` | ERROR | Erros |
| `logger.log()` | INFO | Alias para `info` |

Todas as mensagens são prefixadas com `[NÍVEL]` automaticamente.

## Related

- [AGENTS.md](./AGENTS.md) - Instruções para agentes
