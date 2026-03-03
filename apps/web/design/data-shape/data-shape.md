# Data Shape

## Entities

### Patient
Paciente do consultório. Contém nome, idade, sexo e histórico de avaliações.

### Evaluation
Caso clínico criado pelo wizard. Contém foto intraoral, resultado da análise IA, dentes selecionados, nível de clareamento, tier de orçamento (padrão/premium) e status de processamento.

### EvaluationProtocol
Protocolo de tratamento gerado pela IA para um dente específico de uma avaliação. Inclui tipo de tratamento (resina, porcelana, coroa, implante, endodontia, gengivoplastia, recobrimento radicular), camadas de estratificação, resinas recomendadas, shades e observações clínicas.

### DetectedTooth
Dente identificado pela análise de IA. Contém número FDI, achados clínicos, tipo de tratamento sugerido, prioridade (alta/média/baixa) e confiança da detecção.

### DSDSimulation
Simulação de Digital Smile Design. Contém 4 camadas (gengival, whitening, diastema, restorative), cada uma com imagem antes/depois e descrição.

### Subscription
Assinatura do dentista no plano. Define tier (free/pro/clinic), créditos mensais, limites de uso e status de pagamento Stripe.

### Credit
Registro de consumo de crédito por operação (case_analysis, dsd_simulation, protocol_generation). Controla saldo e idempotência.

### User
Dentista usuário do sistema. Contém perfil, clínica, CRO, preferências de idioma e configurações de notificação.

### InventoryItem
Material disponível no estoque do consultório (resinas, cimentos, corantes). Usado para filtrar recomendações de protocolo.

## Relationships

- User has many Patient
- Patient has many Evaluation
- Evaluation has many EvaluationProtocol
- Evaluation has many DetectedTooth
- Evaluation has one DSDSimulation
- User has one Subscription
- Subscription has many Credit
- User has many InventoryItem
- EvaluationProtocol references InventoryItem
