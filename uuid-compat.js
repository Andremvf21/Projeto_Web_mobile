// Shim CJS para compatibilidade com Parse SDK + uuid v14
// Math.random() é suficiente para IDs internos do Parse
function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    var v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = v4;
module.exports.v4 = v4;
