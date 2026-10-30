const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', '.git'].includes(f)) search(full);
    } else if (f.endsWith('.js') || f.endsWith('.html')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('data-sidebar-open') || c.includes('data-sidebar-close') || c.includes('toggleSidebar') || c.includes('openSidebar')) {
        console.log(full);
      }
    }
  }
}

search('.');
