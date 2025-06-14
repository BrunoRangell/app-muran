
export function parseOFX(ofxText: string) {
  const transactions: any[] = [];
  const lines = ofxText.split('\n');
  
  let currentTransaction: any = {};
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith('<STMTTRN>')) {
      currentTransaction = {};
    } else if (line.startsWith('</STMTTRN>')) {
      // Verificamos se é um custo: deve ter valor negativo (não importa o TRNTYPE)
      if (Object.keys(currentTransaction).length > 0 && 
          Number(currentTransaction.amount) < 0) {
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
    } else if (line.startsWith('<NAME>') || line.startsWith('<MEMO>')) {
      currentTransaction.name = line
        .replace('<NAME>', '')
        .replace('</NAME>', '')
        .replace('<MEMO>', '')
        .replace('</MEMO>', '');
    }
  }
  
  console.log('Transações filtradas (apenas custos):', transactions);
  return { bankAccounts: [{ transactions }] };
}
