
function extractDuplicateItems(arr) {
  return arr.filter(function (x, i, self) {
    return self.indexOf(x) !== self.lastIndexOf(x);
  })
}

export default {
  extractDuplicateItems
}
