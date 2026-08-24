// Customer Repurchase Analyzer - Robust Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    uploadedFiles: [], 
    mergedData: [],    
    targetRepRows: [],   
    targetNoRepRows: [], 
    repFilename: '',
    noRepFilename: '',
    analysisDone: false
  };
  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileListContainer = document.getElementById('file-list-container');
  const fileList = document.getElementById('file-list');
  const fileCount = document.getElementById('file-count');
  const btnClearFiles = document.getElementById('btn-clear-files');
  const btnLoadDemo = document.getElementById('btn-load-demo');
  const btnResetParams = document.getElementById('btn-reset-params');
  const btnRunAnalysis = document.getElementById('btn-run-analysis');
  
  // Inputs
  const inputProduct = document.getElementById('target-product');
  const inputPromo = document.getElementById('promo-codes');
  const inputTargetMonth = document.getElementById('target-month');
  const inputRepPeriod = document.getElementById('repurchase-period');
  const chkIncludeId = document.getElementById('col-include-id');
  // Stats Elements
  const statTotalRows = document.getElementById('stat-total-rows');
  const statTotalFiles = document.getElementById('stat-total-files');
  const statTargetCustomers = document.getElementById('stat-target-customers');
  const statRepCount = document.getElementById('stat-rep-count');
  const statRepRate = document.getElementById('stat-rep-rate');
  const statNoRepCount = document.getElementById('stat-no-rep-count');
  const statNoRepRate = document.getElementById('stat-no-rep-rate');
  const statusBadge = document.getElementById('analysis-status-badge');
  // Download Cards & Buttons
  const repFilenamePreview = document.getElementById('rep-filename-preview');
  const noRepFilenamePreview = document.getElementById('no-rep-filename-preview');
  const btnDownloadRep = document.getElementById('btn-download-rep');
  const btnDownloadNoRep = document.getElementById('btn-download-no-rep');
  // Preview Tables & Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const previewSearch = document.getElementById('preview-search');
  const repTableHead = document.getElementById('rep-table-head');
  const repTableBody = document.getElementById('rep-table-body');
  const noRepTableHead = document.getElementById('no-rep-table-head');
  const noRepTableBody = document.getElementById('no-rep-table-body');
  const tabRepCount = document.getElementById('tab-rep-count');
  const tabNoRepCount = document.getElementById('tab-no-rep-count');
  const logsConsole = document.getElementById('logs-console');
  // --- Logger ---
  function log(message, type = 'info') {
    if (!logsConsole) return;
    const timeStr = new Date().toLocaleTimeString();
    const logLine = document.createElement('div');
    logLine.className = `log-line ${type}`;
    logLine.textContent = `[${timeStr}] ${message}`;
    logsConsole.appendChild(logLine);
    logsConsole.scrollTop = logsConsole.scrollHeight;
  }
  // --- Offline & Online CSV Parsing Helper ---
  function safeParseCSV(text) {
    if (typeof Papa !== 'undefined' && Papa.parse) {
      const res = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
      return res.data || [];
    }
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(row);
    }
    return rows;
  }
  function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i+1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }
  function safeUnparseCSV(data) {
    if (typeof Papa !== 'undefined' && Papa.unparse) {
      return Papa.unparse(data);
    }
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const lines = [headers.join(',')];
    data.forEach(row => {
      const lineValues = headers.map(h => {
        let val = String(row[h] || '');
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      lines.push(lineValues.join(','));
    });
    return lines.join('\r\n');
  }
  // --- Dropzone & File Upload Handling ---
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      }, false);
    });
    dropzone.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.csv'));
      if (files.length > 0) {
        handleFilesUpload(files);
      } else {
        log('❌ 上傳失敗：請拖拽有效的 CSV 檔案！', 'error');
      }
    });
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        handleFilesUpload(files);
      }
    });
  }
  if (btnClearFiles) {
    btnClearFiles.addEventListener('click', () => {
      state.uploadedFiles = [];
      renderFileList();
      log('已清除所有上傳檔案', 'info');
    });
  }
  if (btnResetParams) {
    btnResetParams.addEventListener('click', () => {
      if (inputProduct) inputProduct.value = "QQ";
      if (inputPromo) inputPromo.value = "QQEXOTO2507 ,QQEXOTO25 ,QQOTO2024";
      if (inputTargetMonth) inputTargetMonth.value = "2025/8";
      if (inputRepPeriod) inputRepPeriod.value = "2026/3-2026/6";
      log('已重置篩選條件為預設值', 'info');
      updateFilenamePreviews();
    });
  }
  // --- Live Filename Preview ---
  [inputProduct, inputTargetMonth, inputRepPeriod].forEach(input => {
    if (input) {
      input.addEventListener('input', updateFilenamePreviews);
    }
  });
  function updateFilenamePreviews() {
    const prod = (inputProduct ? inputProduct.value.trim() : '') || 'QQ';
    const tMonth = (inputTargetMonth ? inputTargetMonth.value.trim() : '') || '2025/8';
    const rPeriod = (inputRepPeriod ? inputRepPeriod.value.trim() : '') || '2026/3-2026/6';
    const safeTargetMonth = tMonth.replace(/\//g, '_');
    const safeRepPeriod = rPeriod.replace(/\//g, '_');
    state.repFilename = `${prod}${safeTargetMonth}回購區間${safeRepPeriod}.csv`;
    state.noRepFilename = `${prod}${safeTargetMonth}無回購區間${safeRepPeriod}.csv`;
    if (repFilenamePreview) repFilenamePreview.textContent = state.repFilename;
    if (noRepFilenamePreview) noRepFilenamePreview.textContent = state.noRepFilename;
  }
  updateFilenamePreviews();
  // --- Reading Uploaded Files ---
  async function handleFilesUpload(files) {
    log(`📂 開始處理 ${files.length} 個檔案...`, 'info');
    for (const file of files) {
      if (state.uploadedFiles.some(f => f.file.name === file.name)) {
        log(`- 跳過重複檔案: ${file.name}`, 'warning');
        continue;
      }
      try {
        const { rows, encoding } = await parseCSVWithFallbackEncoding(file);
        if (rows && rows.length > 0) {
          state.uploadedFiles.push({
            file,
            rows,
            headers: Object.keys(rows[0] || {}),
            encoding
          });
          log(`  - 成功讀取檔案: ${file.name} (共 ${rows.length} 筆, 編碼: ${encoding})`, 'success');
        } else {
          log(`  - 警告: ${file.name} 內無有效數據`, 'warning');
        }
      } catch (err) {
        log(`❌ 讀取失敗 ${file.name}: ${err.message}`, 'error');
      }
    }
    renderFileList();
  }
  function parseCSVWithFallbackEncoding(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        const encodingsToTry = ['utf-8', 'shift-jis', 'big5'];
        let parsedResult = null;
        let successEncoding = 'utf-8';
        for (const enc of encodingsToTry) {
          try {
            const decoder = new TextDecoder(enc, { fatal: true });
            const text = decoder.decode(buffer);
            const data = safeParseCSV(text);
            if (data && data.length > 0) {
              const firstHeader = Object.keys(data[0])[0] || '';
              if (!firstHeader.includes('')) {
                parsedResult = data;
                successEncoding = enc;
                break;
              }
            }
          } catch (ex) {
            continue;
          }
        }
        if (!parsedResult) {
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(buffer);
          parsedResult = safeParseCSV(text);
          successEncoding = 'utf-8 (loose)';
        }
        resolve({ rows: parsedResult, encoding: successEncoding });
      };
      reader.onerror = () => reject(new Error('檔案讀取失敗'));
      reader.readAsArrayBuffer(file);
    });
  }
  function renderFileList() {
    if (!fileList || !fileListContainer) return;
    fileList.innerHTML = '';
    if (fileCount) fileCount.textContent = state.uploadedFiles.length;
    if (state.uploadedFiles.length === 0) {
      fileListContainer.classList.add('hidden');
    } else {
      fileListContainer.classList.remove('hidden');
      state.uploadedFiles.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
          <div class="file-item-info">
            <i class="fa-solid fa-file-csv text-success"></i>
            <span class="file-item-name">${item.file.name}</span>
            <span class="file-item-meta">(${item.rows.length} 筆 | ${item.encoding})</span>
          </div>
          <button class="btn-text text-danger btn-remove-file" data-index="${index}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;
        fileList.appendChild(li);
      });
      document.querySelectorAll('.btn-remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          state.uploadedFiles.splice(idx, 1);
          renderFileList();
        });
      });
    }
  }
  // --- Demo Data Generator ---
  if (btnLoadDemo) {
    btnLoadDemo.addEventListener('click', () => {
      log('🪄 正在產出測試資料...', 'info');
      const sampleRows = [];
      const promoPool = ["QQEXOTO2507", "QQEXOTO25", "QQOTO2024", "OTHERPROMO", "SPRING2025"];
      for (let i = 1; i <= 120; i++) {
        const customerId = `CUST_${1000 + (i % 40)}`;
        const isTargetMonth = i % 3 !== 0;
        
        let orderDate;
        if (isTargetMonth) {
          const day = (i % 28) + 1;
          orderDate = `2025/08/${day.toString().padStart(2, '0')} 14:20`;
        } else {
          orderDate = `2025/05/10 10:00`;
        }
        const customerNum = 1000 + (i % 40);
        const isRepurchaser = customerNum % 2 === 0;
        const promoCode = (i % 4 === 0) ? "OTHERPROMO" : promoPool[i % 3];
        sampleRows.push({
          "顧客ID": customerId,
          "受注日": orderDate,
          "販促コード": promoCode,
          "新規/既存（全受注）": (customerNum % 3 === 0) ? "新規" : "既存",
          "電話番号": `0912-34${(1000 + i).toString().substring(1)}`,
          "Eメールアドレス": `user${customerNum}@example.com`
        });
        if (isRepurchaser && i <= 40) {
          sampleRows.push({
            "顧客ID": customerId,
            "受注日": `2026/04/15 11:30`,
            "販促コード": "REPEAT2026",
            "新規/既存（全受注）": "既存",
            "電話番号": `0912-34${(1000 + i).toString().substring(1)}`,
            "Eメールアドレス": `user${customerNum}@example.com`
          });
        }
      }
      state.uploadedFiles = [{
        file: new File(["demo"], "DEMO_ECommerce_Orders_2025_2026.csv"),
        rows: sampleRows,
        headers: Object.keys(sampleRows[0]),
        encoding: 'utf-8-demo'
      }];
      renderFileList();
      log(`🎉 成功載入測試資料！共 ${sampleRows.length} 筆訂單紀錄。`, 'success');
    });
  }
  // --- Period Parsing Helper ---
  function parseYearMonth(periodStr) {
    if (!periodStr) return null;
    const cleanStr = periodStr.trim().replace(/-/g, '/');
    const parts = cleanStr.split('/');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month, key: year * 12 + month };
      }
    }
    return null;
  }
  function parseDateToYearMonth(dateStr) {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    
    const match = str.match(/^(\d{4})[/-](\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      return { year, month, key: year * 12 + month };
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      return { year, month, key: year * 12 + month };
    }
    return null;
  }
  // --- Main Analysis Logic ---
  if (btnRunAnalysis) {
    btnRunAnalysis.addEventListener('click', () => {
      if (state.uploadedFiles.length === 0) {
        alert('請先點擊上傳 CSV 檔案或載入測試資料！');
        log('❌ 執行失敗：尚未上傳任何 CSV 檔案', 'error');
        return;
      }
      log('==================================================', 'info');
      log('🚀 開始執行資料處理與回購/無回購篩選邏輯...', 'info');
      const targetProduct = (inputProduct ? inputProduct.value.trim() : '') || 'QQ';
      const promoCodesRaw = inputPromo ? inputPromo.value.trim() : '';
      const targetMonthRaw = inputTargetMonth ? inputTargetMonth.value.trim() : '';
      const repurchasePeriodRaw = inputRepPeriod ? inputRepPeriod.value.trim() : '';
      const promoCodes = promoCodesRaw.split(/[,，\s]+/).filter(c => c.length > 0);
      log(`📌 商品名稱: ${targetProduct}`, 'info');
      log(`📌 販促碼: [${promoCodes.join(', ')}]`, 'info');
      const targetPeriod = parseYearMonth(targetMonthRaw);
      if (!targetPeriod) {
        alert('目標年月格式錯誤！格式應為 YYYY/M (例如 2025/8)');
        log('❌ 解析目標年月失敗', 'error');
        return;
      }
      log(`📌 目標年月: ${targetPeriod.year}/${targetPeriod.month}`, 'info');
      const repParts = repurchasePeriodRaw.split('-');
      if (repParts.length !== 2) {
        alert('回購區間格式錯誤！格式應為 YYYY/M-YYYY/M (例如 2026/3-2026/6)');
        log('❌ 解析回購區間失敗', 'error');
        return;
      }
      const repStartPeriod = parseYearMonth(repParts[0]);
      const repEndPeriod = parseYearMonth(repParts[1]);
      if (!repStartPeriod || !repEndPeriod) {
        alert('回購區間年月解析失敗！');
        log('❌ 解析回購區間年月失敗', 'error');
        return;
      }
      log(`📌 回購區間: ${repStartPeriod.year}/${repStartPeriod.month} 至 ${repEndPeriod.year}/${repEndPeriod.month}`, 'info');
      let mergedData = [];
      state.uploadedFiles.forEach(f => {
        mergedData = mergedData.concat(f.rows);
      });
      log(`👉 總共合併了 ${state.uploadedFiles.length} 個原始檔案，原始資料共 ${mergedData.length} 筆。`, 'success');
      let targetCustomersSet = new Set();
      let repurchaseCustomersSet = new Set();
      let targetMonthOrderRows = [];
      mergedData.forEach(row => {
        const orderDateStr = row['受注日'] || row['訂單日期'] || row['Order Date'];
        const ym = parseDateToYearMonth(orderDateStr);
        const customerId = row['顧客ID'] || row['客戶ID'] || row['Customer ID'];
        const promoCodeStr = String(row['販促コード'] || row['優惠碼'] || row['Promo Code'] || '');
        if (!ym || !customerId) return;
        if (ym.key === targetPeriod.key) {
          const isPromoMatch = promoCodes.some(code => promoCodeStr.includes(code));
          if (isPromoMatch) {
            targetCustomersSet.add(customerId);
            targetMonthOrderRows.push({ ...row, _ym: ym, _customerId: customerId });
          }
        }
        if (ym.key >= repStartPeriod.key && ym.key <= repEndPeriod.key) {
          repurchaseCustomersSet.add(customerId);
        }
      });
      log(`📊 目標月份包含指定販促碼的顧客數: ${targetCustomersSet.size} 人`, 'info');
      log(`📊 在回購區間有任何消費紀錄的顧客數: ${repurchaseCustomersSet.size} 人`, 'info');
      const targetCustomers = Array.from(targetCustomersSet);
      const repCustomerSet = new Set(targetCustomers.filter(id => repurchaseCustomersSet.has(id)));
      const noRepCustomerSet = new Set(targetCustomers.filter(id => !repurchaseCustomersSet.has(id)));
      log(`✅ 【有回購】顧客人數: ${repCustomerSet.size} 人`, 'success');
      log(`❌ 【無回購】顧客人數: ${noRepCustomerSet.size} 人`, 'warning');
      const targetColsToKeep = ["新規/既存（全受注）", "電話番号", "Eメールアドレス"];
      if (chkIncludeId && chkIncludeId.checked) {
        targetColsToKeep.unshift("顧客ID");
      }
      const repRowsRaw = targetMonthOrderRows.filter(r => repCustomerSet.has(r._customerId));
      const noRepRowsRaw = targetMonthOrderRows.filter(r => noRepCustomerSet.has(r._customerId));
      state.targetRepRows = filterColumns(repRowsRaw, targetColsToKeep);
      state.targetNoRepRows = filterColumns(noRepRowsRaw, targetColsToKeep);
      updateFilenamePreviews();
      if (statTotalRows) statTotalRows.textContent = mergedData.length.toLocaleString();
      if (statTotalFiles) statTotalFiles.textContent = `${state.uploadedFiles.length} 個檔案`;
      if (statTargetCustomers) statTargetCustomers.textContent = targetCustomersSet.size.toLocaleString();
      
      if (statRepCount) statRepCount.textContent = repCustomerSet.size.toLocaleString();
      const repRate = targetCustomersSet.size > 0 ? ((repCustomerSet.size / targetCustomersSet.size) * 100).toFixed(1) : 0;
      if (statRepRate) statRepRate.textContent = `回購率: ${repRate}%`;
      if (statNoRepCount) statNoRepCount.textContent = noRepCustomerSet.size.toLocaleString();
      const noRepRate = targetCustomersSet.size > 0 ? ((noRepCustomerSet.size / targetCustomersSet.size) * 100).toFixed(1) : 0;
      if (statNoRepRate) statNoRepRate.textContent = `未回購率: ${noRepRate}%`;
      if (statusBadge) {
        statusBadge.textContent = '🎉 分析已完成';
        statusBadge.className = 'badge badge-success';
      }
      if (btnDownloadRep) btnDownloadRep.disabled = false;
      if (btnDownloadNoRep) btnDownloadNoRep.disabled = false;
      if (tabRepCount) tabRepCount.textContent = state.targetRepRows.length;
      if (tabNoRepCount) tabNoRepCount.textContent = state.targetNoRepRows.length;
      renderTable(repTableHead, repTableBody, state.targetRepRows);
      renderTable(noRepTableHead, noRepTableBody, state.targetNoRepRows);
      state.analysisDone = true;
      log('🎉 分析與篩選流程順利完成！您可以點擊右側按鈕下載 CSV 結果。', 'success');
    });
  }
  function filterColumns(rowList, columnsToKeep) {
    return rowList.map(row => {
      const cleanRow = {};
      columnsToKeep.forEach(col => {
        cleanRow[col] = row[col] !== undefined ? row[col] : (row[`_${col}`] || '');
      });
      return cleanRow;
    });
  }
  function renderTable(headEl, bodyEl, rows) {
    if (!headEl || !bodyEl) return;
    headEl.innerHTML = '';
    bodyEl.innerHTML = '';
    if (rows.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="5" class="empty-state">此類別尚無符合資料</td></tr>`;
      return;
    }
    const headers = Object.keys(rows[0]);
    
    const trHead = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    headEl.appendChild(trHead);
    const previewRows = rows.slice(0, 50);
    previewRows.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach(h => {
        const td = document.createElement('td');
        td.textContent = row[h] || '';
        tr.appendChild(td);
      });
      bodyEl.appendChild(tr);
    });
    if (rows.length > 50) {
      const trMore = document.createElement('tr');
      trMore.innerHTML = `<td colspan="${headers.length}" class="empty-state">... 還有 ${rows.length - 50} 筆資料，完整的資料請點擊下載 CSV 檢視</td>`;
      bodyEl.appendChild(trMore);
    }
  }
  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetTabId = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(targetTabId);
      if (targetEl) targetEl.classList.add('active');
    });
  });
  // Search Filter
  if (previewSearch) {
    previewSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const activeTabEl = document.querySelector('.tab-content.active');
      if (!activeTabEl) return;
      const activeTab = activeTabEl.id;
      if (activeTab === 'tab-rep') {
        const filtered = state.targetRepRows.filter(r => 
          Object.values(r).some(v => String(v).toLowerCase().includes(query))
        );
        renderTable(repTableHead, repTableBody, filtered);
      } else if (activeTab === 'tab-no-rep') {
        const filtered = state.targetNoRepRows.filter(r => 
          Object.values(r).some(v => String(v).toLowerCase().includes(query))
        );
        renderTable(noRepTableHead, noRepTableBody, filtered);
      }
    });
  }
  // Download Buttons Handler
  if (btnDownloadRep) {
    btnDownloadRep.addEventListener('click', () => {
      if (state.targetRepRows.length === 0) {
        alert('【有回購名單】目前為 0 筆！');
        return;
      }
      exportCSV(state.targetRepRows, state.repFilename);
      log(`📥 已下載檔案: ${state.repFilename}`, 'success');
    });
  }
  if (btnDownloadNoRep) {
    btnDownloadNoRep.addEventListener('click', () => {
      if (state.targetNoRepRows.length === 0) {
        alert('【無回購名單】目前為 0 筆！');
        return;
      }
      exportCSV(state.targetNoRepRows, state.noRepFilename);
      log(`📥 已下載檔案: ${state.noRepFilename}`, 'success');
    });
  }
  function exportCSV(data, filename) {
    const csvString = safeUnparseCSV(data);
    const bom = '\ufeff';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
});