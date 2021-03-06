declare const Components: any
declare const Subprocess: any
declare const Zotero: any

Components.utils.import('resource://gre/modules/Subprocess.jsm')

import { KeyManager } from './key-manager.ts'
import { debug } from './debug.ts'

// export singleton: https://k94n.com/es6-modules-single-instance-pattern
export let TeXstudio = new class { // tslint:disable-line:variable-name
  public enabled: boolean
  public texstudio: string

  public async init() {
    try {
      this.texstudio = await Subprocess.pathSearch(`texstudio${Zotero.platform.toLowerCase().startsWith('win') ? '.exe' : ''}`)
    } catch (err) {
      debug('TeXstudio: not found:', err)
      this.texstudio = null
    }
    this.enabled = !!this.texstudio
    if (this.enabled) debug('TeXstudio: found at', this.texstudio)
  }

  public async push() {
    if (!this.enabled) throw new Error('texstudio was not found')

    const pane = Zotero.getActiveZoteroPane() // can Zotero 5 have more than one pane at all?

    let items
    try {
      items = pane.getSelectedItems()
      debug('TeXstudio:', items)
    } catch (err) { // zoteroPane.getSelectedItems() doesn't test whether there's a selection and errors out if not
      debug('TeXstudio: Could not get selected items:', err)
      return
    }

    const citation = items.map(item => KeyManager.get(item.id).citekey).filter(citekey => citekey).join(',')
    if (!citation) {
      debug('TeXstudio: no items to cite')
      return
    }

    try {
      await Zotero.Utilities.Internal.exec(this.texstudio, ['--insert-cite', citation])
    } catch (err) {
      debug('TeXstudio: Could not get execute texstudio:', err)
    }
  }
}
