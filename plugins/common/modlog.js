

function getLog(mod) {
  return function() {

    let args = ['['+mod+']:']

    for (i in arguments) {
      args.push(arguments[i])
    }

    console.log.apply(console, args)
  }
}


function getError(mod) {

  return function() {

    let args = ['['+mod+']:']

    for (i in arguments) {
      args.push(arguments[i])
    }

    console.error.apply(console, args)
  }
}


module.exports = {
  getLog: getLog,
  getError: getError
}
