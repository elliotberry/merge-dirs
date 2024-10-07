import inquirer from 'inquirer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {conflictResolvers} from './conflict-resolvers.js';


async function copyFile(file, location) {
  const dirPath = path.dirname(file);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.copyFile(location, file);
}

function renameQuestionFactory(destination) {
  const defaultNewName = `conflict-${destination.split(path.sep).pop()}`;
  return {
    default: defaultNewName,
    message: 'What do you want to name the second file?',
    name: 'fileName',
    type: 'input',
  };
}

function conflictQuestionFactory(f1, f2) {
  return {
    choices: ['skip', new inquirer.Separator(), 'overwrite', new inquirer.Separator(), 'keep both'],
    message: `conflict: ${f1} - ${f2}`,
    name: 'resolution',
    type: 'list',
  };
}

async function saveRenamedFile(source, destination) {
  const { fileName } = await inquirer.prompt([renameQuestionFactory(destination)]);
  const newDestination = path.join(path.dirname(destination), fileName);
  await copyFile(newDestination, source);
}

async function resolveConflict(source, destination) {
  const { resolution } = await inquirer.prompt([conflictQuestionFactory(source, destination)]);
  switch (resolution) {
    case 'overwrite': {
      await copyFile(source, destination);
      break;
    }
    case 'keep both': {
      await saveRenamedFile(source, destination);
      break;
    }
    default:
    // skip
  }
}

async function fileAsk(source, destination) {
  await resolveConflict(source, destination);
}

async function mergeDirectories(source, destination, conflictResolver = conflictResolvers.skip) {
  // handle false, for backward compatibility
  if (conflictResolver === false) {
    conflictResolver = conflictResolvers.skip;
  } else if (conflictResolver === true) {
    conflictResolver = conflictResolvers.overwrite;
  }

  try {
    const files = await fs.readdir(source);

    for (const file of files) {
      const sourceFile = path.join(source, file);
      const destinationFile = path.join(destination, file);
      const stats = await fs.lstat(sourceFile);

      if (stats.isDirectory()) {
        await mergeDirectories(sourceFile, destinationFile, conflictResolver);
      } else {
        const destinationExists = await fs.access(destinationFile).then(() => true).catch(() => false);
        
        if (destinationExists) {
          switch (conflictResolver) {
            case conflictResolvers.ask: {
              await fileAsk(sourceFile, destinationFile);
              break;
            }
            case conflictResolvers.overwrite: {
              await copyFile(destinationFile, sourceFile);
              break;
            }
            case conflictResolvers.skip: {
              console.log(`${destinationFile} exists, skipping...`);
              break;
            }
          }
        } else {
          await copyFile(destinationFile, sourceFile);
        }
      }
    }
  } catch (error) {
    console.error(`Error merging directories: ${error.message}`);
  }
}

export default mergeDirectories