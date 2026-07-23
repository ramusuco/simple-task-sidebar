const vscode = require('vscode');

class TaskTreeProvider {
  constructor() {
    this.changeEmitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.changeEmitter.event;
  }

  refresh() {
    this.changeEmitter.fire(undefined);
  }

  getTreeItem(task) {
    const item = new vscode.TreeItem(
      task.name,
      vscode.TreeItemCollapsibleState.None,
    );

    item.description = task.source;
    item.tooltip = `${task.name}\nSource: ${task.source}`;
    item.iconPath = new vscode.ThemeIcon('play');
    item.command = {
      command: 'taskSidebar.runTask',
      title: 'Run Task',
      arguments: [task],
    };

    return item;
  }

  async getChildren(element) {
    if (element) {
      return [];
    }

    const tasks = await vscode.tasks.fetchTasks();
    return tasks.sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
  }

  dispose() {
    this.changeEmitter.dispose();
  }
}

function activate(context) {
  const provider = new TaskTreeProvider();
  const treeView = vscode.window.createTreeView('taskSidebar.tasks', {
    treeDataProvider: provider,
  });

  const refreshCommand = vscode.commands.registerCommand(
    'taskSidebar.refresh',
    () => provider.refresh(),
  );

  const runTaskCommand = vscode.commands.registerCommand(
    'taskSidebar.runTask',
    async (task) => {
      if (!task) {
        return;
      }

      try {
        await vscode.tasks.executeTask(task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Could not run task: ${message}`);
      }
    },
  );

  context.subscriptions.push(
    provider,
    treeView,
    refreshCommand,
    runTaskCommand,
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
