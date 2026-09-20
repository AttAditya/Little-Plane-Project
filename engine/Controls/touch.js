function touchDown(key) {
  registerKeyPress({ key });
}

function touchUp(key) {
  deregisterKeyPress({ key });
}

window.oncontextmenu = (e) => e.preventDefault();

