
export function parseOFX(ofxText: string) {
  const transactions: any[] = [];
  const lines = ofxText.split('\n');
  
  let currentTransaction: any = {};
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith('<STMTTRN>')) {
      currentTransaction = {};
    } else if (line.startsWith('</STMTTRN>')) {
      // Incluir todas as transações válidas (débitos e créditos)
      if (Object.keys(currentTransaction).length > 0 && 
          currentTransaction.amount && 
          currentTransaction.date &&
          (currentTransaction.name || currentTransaction.memo)) {
        transactions.push(currentTransaction);
      }
    } else if (line.startsWith('<TRNTYPE>')) {
      currentTransaction.type = line.replace('<TRNTYPE>', '').replace('</TRNTYPE>', '');
    } else if (line.startsWith('<DTPOSTED>')) {
      const dateStr = line.replace('<DTPOSTED>', '').replace('</DTPOSTED>', '');
      // Formato esperado: AAAAMMDD
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      currentTransaction.date = `${year}-${month}-${day}`;
    } else if (line.startsWith('<TRNAMT>')) {
      currentTransaction.amount = line.replace('<TRNAMT>', '').replace('</TRNAMT>', '');
    } else if (line.startsWith('<FITID>')) {
      currentTransaction.fitId = line.replace('<FITID>', '').replace('</FITID>', '');
    } else if (line.startsWith('<NAME>')) {
      currentTransaction.name = line.replace('<NAME>', '').replace('</NAME>', '');
    } else if (line.startsWith('<MEMO>')) {
      currentTransaction.memo = line.replace('<MEMO>', '').replace('</MEMO>', '');
      // Se não há nome, usar memo como nome
      if (!currentTransaction.name) {
        currentTransaction.name = currentTransaction.memo;
      }
    } else if (line.startsWith('<PAYEE>')) {
      currentTransaction.payee = line.replace('<PAYEE>', '').replace('</PAYEE>', '');
      // Se não há nome nem memo, usar payee como nome
      if (!currentTransaction.name && !currentTransaction.memo) {
        currentTransaction.name = currentTransaction.payee;
      }
    }
  }
  
  console.log('Transações filtradas (apenas custos):', transactions);
  return { bankAccounts: [{ transactions }] };
}
