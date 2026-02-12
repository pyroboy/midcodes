const fs = require('fs');

let data = fs.readFileSync('src/lib/data/menu-sku.json', 'utf8');

// Replace raw egg references with Fried Egg prep product
// Pattern: "id": "RM-PR-001", followed by "qty": "1 pc"
data = data.replace(
  /"id": "RM-PR-001",\s*\n\s*"qty": "1 pc"/g,
  '"id": "PP-020",\n          "qty": "1 serving"'
);

fs.writeFileSync('src/lib/data/menu-sku.json', data);
console.log('Updated egg references to use PP-020 (Fried Egg)');
