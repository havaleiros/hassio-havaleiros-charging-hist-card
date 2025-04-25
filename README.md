# Havaleiros Brasil - Card para Home Assistant com Histórico de carregamento para veículos GWM

Este é um cartão customizado para Home Assistant que exibe o histórico de carregamento do seu veículo.

### Passo a Passo para adicionar um novo repositório no HACS

1. Certifique-se de que o HACS já está instalado e configurado no seu Home Assistant. Caso ainda não tenha instalado, siga o [guia de instalação do HACS](https://hacs.xyz/docs/use/).

2. Acesse a interface web do Home Assistant.

3. No menu lateral, clique em **HACS**.

4. No canto superior direito da tela, clique no ícone de três pontos verticais e selecione **Custom repositories** (Repositórios personalizados).

5. Na janela que abrir, insira o URL do repositório que deseja adicionar no campo **Repository**.

6. No campo **Type**, selecione a categoria **Dashboard**.

7. Clique em **Add** (Adicionar) para salvar o repositório.

8. Após adicionar o repositório, ele estará disponível na seção correspondente do HACS. Navegue até a categoria apropriada, localize o repositório e clique em **Install** (Instalar) para adicioná-lo ao seu Home Assistant.

9. Reinicie o Home Assistant, se necessário, para aplicar as alterações.

10. Após instalado, adicione o cartão como `gwm-charging-history-card`.

Agora, o repositório estará configurado e pronto para uso no seu Home Assistant.

## Exemplo de uso

```yaml
type: custom:gwm-charging-history-card
entity: sensor.gwmbrasil_{chassis}_estado_de_carga_soc
```