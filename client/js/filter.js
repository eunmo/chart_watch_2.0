chartwatchApp.filter('capitalize', function () {
  return function (string) {
    if (string.length < 3)
      return string.toUpperCase();

    return string.charAt(0).toUpperCase() + string.slice(1);
  };
});
