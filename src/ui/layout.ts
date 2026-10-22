// Scheletro della finestra in stile VS Code. Restituisce i contenitori che gli
// altri moduli riempiono.
import { icon } from '../core/util';

export interface Layout {
  titleText: HTMLElement;
  activity: HTMLElement;
  sidebar: HTMLElement;
  tabs: HTMLElement;
  breadcrumbs: HTMLElement;
  editor: HTMLElement;
  terminals: HTMLElement;
  devicesPane: HTMLElement;
  mapPane: HTMLElement;
  statusbar: HTMLElement;
}

export function buildLayout(root: HTMLElement): Layout {
  const platform = new URLSearchParams(location.search).get('platform');
  document.body.classList.add(platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : 'web');

  root.innerHTML = `
  <div class="workbench">
    <header class="titlebar">
      <span class="fake-lights"><i></i><i></i><i></i></span>
      <span class="menus">
        <span>File</span><span>Modifica</span><span>Selezione</span><span>Visualizza</span>
        <span>Vai</span><span>Esegui</span><span>Terminale</span><span>Aiuto</span>
      </span>
      <div class="cmd-center"><div class="cmd-box">${icon('search')} <span data-ref="titleText">operazione_pizza — mainframe</span></div></div>
      <div class="tb-right">${icon('layout-sidebar-left')}${icon('layout-panel')}${icon('layout-sidebar-right')}</div>
    </header>
    <div class="main">
      <nav class="activitybar" data-ref="activity"></nav>
      <aside class="sidebar" data-ref="sidebar"></aside>
      <section class="center">
        <div class="editor-area">
          <div class="tabs" data-ref="tabs"></div>
          <div class="breadcrumbs" data-ref="breadcrumbs"></div>
          <div class="editor" tabindex="0" data-ref="editor"></div>
        </div>
        <div class="panel">
          <div class="panel-tabs">
            <span>PROBLEMI <b class="c-warn">3</b></span><span>OUTPUT</span><span>CONSOLE DI DEBUG</span>
            <span class="active">TERMINALE</span><span>PORTE</span>
            <span class="right">${icon('add')}${icon('split-horizontal')}${icon('trash')}${icon('chevron-up')}${icon('close')}</span>
          </div>
          <div class="terminals" data-ref="terminals"></div>
        </div>
      </section>
      <aside class="rightbar">
        <div class="pane devices-pane" data-ref="devicesPane"></div>
        <div class="pane map-pane" data-ref="mapPane"></div>
      </aside>
    </div>
    <footer class="statusbar" data-ref="statusbar"></footer>
  </div>
  <div id="windows-layer"></div>
  <div id="overlay-layer"></div>
  <div id="toasts"></div>
  <div id="crt"></div>`;

  const ref = (name: string) => root.querySelector<HTMLElement>(`[data-ref="${name}"]`)!;
  return {
    titleText: ref('titleText'),
    activity: ref('activity'),
    sidebar: ref('sidebar'),
    tabs: ref('tabs'),
    breadcrumbs: ref('breadcrumbs'),
    editor: ref('editor'),
    terminals: ref('terminals'),
    devicesPane: ref('devicesPane'),
    mapPane: ref('mapPane'),
    statusbar: ref('statusbar'),
  };
}
