const fs = require('fs');

const imgPath = 'C:/Users/admin/.gemini/antigravity/brain/0921c725-7f46-4040-842b-c3e9f208154e/.user_uploaded/media_1792920371671_9dba3fa9.png';
console.log('Image exists?', fs.existsSync(imgPath));
if (fs.existsSync(imgPath)) {
  const stat = fs.statSync(imgPath);
  console.log('Size:', stat.size);
}
