import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'

const conflictResolvers = {
  ask: 'ask',
  skip: 'skip',
  overwrite: 'overwrite'
}

function copyFile (file, location) {
  fs.mkdirSync((file).split('/').slice(0, -1).join('/'), 0x1ed, true)
  fs.writeFileSync(file, fs.readFileSync(location))
}

function renameQuestionFactory (dest) {
  const defaultNewName = `conflict-${dest.split(path.sep).pop()}`
  return {
    type: 'input',
    name: 'fileName',
    message: 'What do you want to name the second file?',
    default: defaultNewName
  }
}

function conflictQuestionFactory (f1, f2) {
  return {
    type: 'list',
    name: 'resolution',
    message: `conflict: ${f1} - ${f2}`,
    choices: ['skip', new inquirer.Separator(), 'overwrite', new inquirer.Separator(), 'keep both']
  }
}

function saveRenamedFile (src, dest) {
  return ({fileName}) => {
    const newName = fileName
    const newDest = dest.split(path.sep).slice(0, -1).join(path.sep) + path.sep + newName
    copyFile(newDest, src)
  };
}

function resolveConflict (src, dest) {
  return ({resolution}) => {
    switch (resolution) {
      case 'overwrite':
        copyFile(src, dest)
        break
      case 'keep both':
        inquirer.prompt([renameQuestionFactory(dest)], saveRenamedFile(src, dest))
        break
      default:

    }
  };
}

function fileAsk (src, dest) {
  const question = conflictQuestionFactory(src, dest);
  inquirer.prompt([question], resolveConflict(src, dest))
}

function mergeDirs (src, dest, conflictResolver = conflictResolvers.skip) {
  // handle false, for backward compatability
  if (conflictResolver === false) {
    conflictResolver = conflictResolvers.skip
  } else if (conflictResolver === true) {
    conflictResolver = conflictResolvers.overwrite
  }
  const files = fs.readdirSync(src)

  files.forEach((file) => {
    const srcFile = `${src}/${file}`
    const destFile = `${dest}/${file}`
    const stats = fs.lstatSync(srcFile)

    if (stats.isDirectory()) {
      mergeDirs(srcFile, destFile, conflictResolver)
    } else {
      // console.log({srcFile, destFile}, 'conflict?', fs.existsSync(destFile))
      if (!fs.existsSync(destFile)) {
        copyFile(destFile, srcFile)
      } else {
        switch (conflictResolver) {
          case conflictResolvers.ask:
            fileAsk(srcFile, destFile)
            break
          case conflictResolvers.overwrite:
            copyFile(destFile, srcFile)
            break
          case conflictResolvers.skip:
            console.log(`${destFile} exists, skipping...`)
        }
      }
    }
  })
}
export {mergeDirs as default, conflictResolvers}