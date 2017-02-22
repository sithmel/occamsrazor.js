module.exports = function wrapConstructor(Constructor) {
  function closure() {
    var newobj, out,
      New = function () {};
    New.prototype = Constructor.prototype;
    newobj = new New;
    newobj.constructor = Constructor;
    out = Constructor.apply(newobj, Array.prototype.slice.call(arguments));
    if (out === undefined) {
      return newobj;
    }
    return out;
  }
  return closure;
};
