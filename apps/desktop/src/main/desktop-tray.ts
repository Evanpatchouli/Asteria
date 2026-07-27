import {
  Menu,
  Tray,
  type MenuItemConstructorOptions,
  type NativeImage,
} from "electron";

export interface DesktopTrayActions {
  /** Centers and reveals the desktop window. */
  centerWindow(): void;
  hideWindow(): void;
  isClickThrough(): boolean;
  isWindowVisible(): boolean;
  quitApplication(): void;
  setClickThrough(enabled: boolean): void;
  showWindow(): void;
}

export interface DesktopTrayHandle {
  destroy(): void;
  refresh(): void;
}

/**
 * Creates the native recovery surface for hidden or click-through windows.
 */
export function createDesktopTray(
  icon: NativeImage,
  actions: DesktopTrayActions,
): DesktopTrayHandle {
  const tray = new Tray(icon);

  const refresh = (): void => {
    const visibilityAction: MenuItemConstructorOptions =
      actions.isWindowVisible()
        ? {
            click: () => {
              actions.hideWindow();
              refresh();
            },
            label: "隐藏",
          }
        : {
            click: () => {
              actions.showWindow();
              refresh();
            },
            label: "显示",
          };

    tray.setContextMenu(
      Menu.buildFromTemplate([
        visibilityAction,
        {
          click: () => {
            actions.centerWindow();
            refresh();
          },
          label: "窗口居中",
        },
        {
          checked: actions.isClickThrough(),
          click: (menuItem) => {
            actions.setClickThrough(menuItem.checked);
            refresh();
          },
          label: "鼠标穿透",
          type: "checkbox",
        },
        {
          type: "separator",
        },
        {
          click: () => {
            actions.quitApplication();
          },
          label: "退出",
        },
      ]),
    );
  };

  tray.setToolTip("Asteria");
  tray.on("click", () => {
    if (actions.isWindowVisible()) {
      actions.hideWindow();
    } else {
      actions.showWindow();
    }
    refresh();
  });
  refresh();

  return {
    destroy() {
      if (!tray.isDestroyed()) {
        tray.destroy();
      }
    },
    refresh,
  };
}
