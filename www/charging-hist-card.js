class ChargingHistoryCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.filteredLogs = [];
      this.startDate = '';
      this.endDate = '';
      this.minDuration = 0;
      this._rawLogs = [];
      this.lastUpdate = '';
      this.rowsPerPage = 20;
      this.currentPage = 1;
    }
  
    getCardSize() {
      return 1;
    }
  
    set hass(hass) {
      this._hass = hass;
    
      const newLogs = this._getLogs();
      const currentRaw = JSON.stringify(this._rawLogs);
      const newRaw = JSON.stringify(newLogs);
  
      if (currentRaw !== newRaw) {
        this._rawLogs = newLogs;
        this._filterLogs();
        this.render();
      }
    }
  
    setConfig(config) {
      if (!config.entity) {
        throw new Error("Você precisa definir um sensor com o atributo 'charging_logs'.");
      }
      this.config = config;
    }
  
    _formatarDuracao(ms) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h${m.toString().padStart(2, '0')}m`;
    }
  
    _getLogs() {
      const entity = this._hass.states[this.config.entity];
      if (!entity || !entity.attributes.charging_logs) return [];
    
      this.lastUpdate = entity.attributes.last_update;
  
      const raw = entity.attributes.charging_logs;
      const cleaned = String(raw).replace(/^\[\s*'/, '').replace(/'\s*\]$/, '').split(',');
    
      const entries = cleaned.filter(x => x.includes('~'));
      const registros = [];
    
      entries.forEach(item => {
        const [inicio, fim] = item.split('~').map(x => x.trim());
    
        // Conversão do formato DD/MM/YYYY HH:mm para MM/DD/YYYY HH:mm
        const start = new Date(inicio.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
        const end = new Date(fim.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
    
        registros.push({
          inicio,
          fim,
          duracao: Math.round((end - start) / 60000),
          duracaoFormatada: this._formatarDuracao(end - start)
        });
      });
    
      return registros;
    }
    
    _parseDateTimeBr(dateTimeStr) {
      const [datePart, timePart] = dateTimeStr.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes] = timePart.split(':');
      return new Date(year, month - 1, day, hours, minutes);
    }
  
    _filterLogs() {
      const logs = this._getLogs();
  
      this.filteredLogs = logs.filter(log => {
        const start = this._parseDateTimeBr(log.inicio);
        const end = this._parseDateTimeBr(log.fim);
        const duration = log.duracao;
  
        const startFilter = this.startDate ? new Date(this.startDate + 'T00:00') <= start : true;      
        const endFilter = this.endDate ? new Date(this.endDate + 'T23:59:59') >= end : true;
        const durationFilter = this.minDuration ? duration >= this.minDuration : true;
  
        return startFilter && endFilter && durationFilter;
      });
    }
  
    _exportCSV() {
      const rows = [['Início', 'Fim', 'Duração']];
      this.filteredLogs.forEach(log => {
        rows.push([log.inicio, log.fim, `${log.duracao}`]);
      });
  
      const csv = rows.map(e => e.join(',')).join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
  
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    
      link.download = `gwm_historico_de_carregamento_${timestamp}.csv`;
      link.click();
    }
  
    _getPaginatedLogs() {
      const start = (this.currentPage - 1) * this.rowsPerPage;
      return this.filteredLogs.slice(start, start + this.rowsPerPage);
    }
    
    _getTotalPages() {
      return Math.max(1, Math.ceil(this.filteredLogs.length / this.rowsPerPage));
    }
  
    render() {
    const paginatedLogs = this._getPaginatedLogs();
    const rows = paginatedLogs.map(log => `
      <tr>
        <td>${log.inicio}</td>
        <td>${log.fim}</td>
        <td>${log.duracaoFormatada}</td>
      </tr>
    `).join('');
  
    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
        }
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        input, select {
          padding: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ccc;
        }
        button {
          padding: 6px 12px;
          cursor: pointer;
          margin-left: 4px;
        }
        .pagination {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
      </style>
  
      <ha-card header="Histórico de Carregamento">
        <div class="filters">
          📅 De: 
          <input type="date" value="${this.startDate}" 
            onchange="this.getRootNode().host.startDate = this.value; this.getRootNode().host._filterLogs(); this.getRootNode().host.currentPage = 1; this.getRootNode().host.render();">
          
          até: 
          <input type="date" value="${this.endDate}" 
            onchange="this.getRootNode().host.endDate = this.value; this.getRootNode().host._filterLogs(); this.getRootNode().host.currentPage = 1; this.getRootNode().host.render();">
          
          🕵️ Duração mínima: 
          <input type="number" placeholder="Duração mínima (min)" value="${this.minDuration}" 
            onchange="this.getRootNode().host.minDuration = Number(this.value); this.getRootNode().host._filterLogs(); this.getRootNode().host.currentPage = 1; this.getRootNode().host.render();">          
        </div>
  
        <h3>Última atualização: ${this.lastUpdate}</h3> 
  
        <table>
          <thead>
            <tr>
              <th>Início</th>
              <th>Fim</th>
              <th>Duração</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
  
        <div class="pagination">
          Linhas por página:
          <select onchange="this.getRootNode().host.rowsPerPage = Number(this.value); this.getRootNode().host.currentPage = 1; this.getRootNode().host.render();">
            <option value="20" ${this.rowsPerPage === 20 ? 'selected' : ''}>20</option>
            <option value="50" ${this.rowsPerPage === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${this.rowsPerPage === 100 ? 'selected' : ''}>100</option>
          </select>
  
          <button ${this.currentPage === 1 ? 'disabled' : ''} 
            onclick="this.getRootNode().host.currentPage--; this.getRootNode().host.render();">⬅️ Anterior</button>        
  
          <button ${this.currentPage >= this._getTotalPages() ? 'disabled' : ''} 
            onclick="this.getRootNode().host.currentPage++; this.getRootNode().host.render();">Próxima ➡️</button>
          
          Página ${this.currentPage} de ${this._getTotalPages()}
        </div>
  
        <button onclick="this.getRootNode().host._exportCSV()">Exportar CSV</button>
      </ha-card>
    `;
  }
  
  }
  
  customElements.define("gwm-charging-history-card", ChargingHistoryCard);  