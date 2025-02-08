"use strict";

// ----------------------------------------------------------------
// WIDGET CLASSES

// This wraps any DOM element, making it hideable and focusable.
// This is just a keystroke-saver.
export class GenericElement {
  constructor(
    elementID,
  ) {
    this.underlying = _getElementById(elementID)
  }

  makeVisible(newStyle /* may be omitted */) {
    // Null is best for show/hide of table rows/cells, vs. "block" or "inline"
    if (newStyle === null || newStyle === undefined) {
      this.underlying.style.display = null
    } else {
      this.underlying.style.display = newStyle
    }
  }

  makeInvisible() {
    this.underlying.style.display = "none"
  }

  focus() {
    this.underlying.focus()
  }
}

// This is a standard slider, nominally for light-theme/dark-theme selector.
export class ToggleSlider extends GenericElement {
  constructor(
    sliderElementID,
    labelElementID,
    isUncheckedLabel,
    isCheckedLabel,
    toUncheckedCallback,
    toCheckedCallback,
  ) {
    super(sliderElementID)

    // Browser-model element by composition
    // * Underlying unchecked = slider left = light theme
    // * Underlying checked   = slider left = dark  theme
    this.underlyingSlider = _getElementById(sliderElementID)
    this.underlyingLabel  = _getElementById(labelElementID)
    // This lets underlying-level callbacks invoke our methods
    this.underlyingSlider.parent = this

    this.isUncheckedLabel    = isUncheckedLabel
    this.isCheckedLabel      = isCheckedLabel
    this.toUncheckedCallback = toUncheckedCallback
    this.toCheckedCallback   = toCheckedCallback

    this.underlyingSlider.addEventListener("change", function(e) {
      const obj = this.parent // Map from browser-level up to class-level
      if (this.checked) { // Here, this is the underlying, and this.checked is the new state
        obj.toChecked(e)
      } else {
        obj.toUnchecked(e)
      }
    })
  }

  // Set the browser-level elements we control
  toUnchecked(e) {
    this.toUncheckedCallback(e)
    this.underlyingLabel.textContent = this.isUncheckedLabel
    this.underlyingSlider.checked = false
  }
  toChecked(e) {
    this.toCheckedCallback(e)
    this.underlyingLabel.textContent = this.isCheckedLabel
    this.underlyingSlider.checked = true
  }
}

// Uses local storage to remember the state of the slider. Nominally for
// light-theme/dark-theme selector.
export class PersistentToggleSlider extends ToggleSlider {

  constructor(
    sliderElementID,
    labelElementID,
    isUncheckedLabel,
    isCheckedLabel,
    toUncheckedCallback,
    toCheckedCallback,
  ) {

    super(
      sliderElementID,
      labelElementID,
      isUncheckedLabel,
      isCheckedLabel,
      toUncheckedCallback,
      toCheckedCallback,
    )

    this.localStorageKey = _localStorageKeyBase() + + ":" + sliderElementID + ":checked"

    // Restore previous state upon construction
    if (localStorage.getItem(this.localStorageKey) == "true") {
      this.toChecked(null)
    } else {
      this.toUnchecked(null)
    }
  }

  // Remember last-set state
  toUnchecked(e) {
    super.toUnchecked(e)
    localStorage.setItem(this.localStorageKey, "false")
  }
  toChecked(e) {
    super.toChecked(e)
    localStorage.setItem(this.localStorageKey, "true")
  }
}

// Specialization of PersistentToggleSlider for a light-theme/dark-theme slider.
// Just a keystroke-saver.
export class LightDarkThemeSlider extends PersistentToggleSlider {
  // Lightly decorates PersistentToggleSlider by adding labels
  constructor(sliderElementID, labelElementID, lightenCallback, darkenCallback) {
    super(
      sliderElementID,
      labelElementID,
      "Switch to dark theme",
      "Switch to light theme",
      lightenCallback,
      darkenCallback,
    )
  }
}

// Standard button, with an accessor for changing the button text.
export class Button extends GenericElement {
  constructor(
    elementID,
    text,
      // If null, HTML content is left as-is. This way you can set button text from JS or HTML.
    callback,
  ) {
    super(elementID)

    // Browser-model element by composition
    this.underlying = _getElementById(elementID)
    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    if (text != null) { // Otherwise leave it as in the HTML.
      this.underlying.textContent = text
    }

    this.underlying.addEventListener("click", function(event) {
      const obj = this.parent // Map from browser-level up to class-level
      obj.callback(event)
    })
  }

  setTextContent(text) {
    this.underlying.textContent = text
  }
}

// Single-line text input.
export class TextInput extends GenericElement {
  // Single-line input element
  constructor(elementID, callback) {
    super(elementID)

    // Browser-model element by composition
    this.underlying = _getElementById(elementID)

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.addEventListener("input", function(event) {
      const obj = this.parent // Map from browser-level up to class-level
      obj.callback(event)
    })
  }
  set(text) {
    this.underlying.value = text
  }
  get(text) {
    return this.underlying.value
  }
}

// Single-line text input, with constraint callback.
export class ConstrainedTextInput extends GenericElement {
  // Single-line input element.
  // The constrainer callback lets the app modify the input: e.g. removing whitespace,
  // removing special characters, upper-casing, lower-casing, etc.
  constructor(elementID, constrainerCallback, eventCallback) {
    super(elementID)

    // Browser-model element by composition
    this.underlying = _getElementById(elementID)

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.constrainerCallback = constrainerCallback
    this.eventCallback = eventCallback

    this.underlying.addEventListener("input", function(event) {
      const obj = this.parent // Map from browser-level up to class-level
      this.value = obj.constrainerCallback(this.value)
      obj.eventCallback(event)
    })
  }
  set(text) {
    this.underlying.value = this.constrainerCallback(text)
  }
  get(text) {
    return this.underlying.value
  }
}

// Non-editable text output.
export class TextSpan extends GenericElement {
  constructor(elementID, initialText) {
    super(elementID)
    // Browser-model element by composition
    this.underlying = _getElementById(elementID)
    this.underlying.textContent = initialText
  }

  set(text) {
    this.underlying.textContent = text
  }
}

// Int-selector with min/max caps, and protection against non-numeric user input.
// There is optional peering: one element's value must be <= or >= its peer's value.
export class IntRangeInput extends GenericElement {
  constructor(elementID, defaultValue, minAllowable, maxAllowable, callback) {
    super(elementID)

    this.defaultValue = defaultValue
    // Min/max values for this widget:
    this.minAllowable = minAllowable
    this.maxAllowable = maxAllowable
    // Another IntRangeInput we're coupled to:
    this.peerMin = null
    this.peerMax = null

    // Browser-model element by composition
    this.underlying = _getElementById(elementID)
    this.underlying.value = this.defaultValue

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.addEventListener("change", function(event) {
      const obj = this.parent // Map from browser-level up to class-level

      // The up-and-down sliders won't let the user choose outside the widget's min/max.
      // But the user can still type "999" or "aaa" into the widget. Here we protect against this.
      if (!isInteger(event.target.value)) {
        obj.underlying.value = obj.defaultValue
      } else {
        const requestedValue = Number(event.target.value)

        // Check self-bounds
        if (requestedValue < obj.minAllowable) {
          obj.underlying.value = obj.minAllowable
        } else if (requestedValue > obj.maxAllowable) {
          obj.underlying.value = obj.maxAllowable

        // Check peer-bounds
        } else if (obj.peerMin != null && requestedValue < obj.peerMin.get()) {
          obj.underlying.value = obj.peerMin.get()
        } else if (obj.peerMax != null && requestedValue > obj.peerMax.get()) {
          obj.underlying.value = obj.peerMax.get()
        }
      }

      obj.callback(event)
    })
  }

  setPeerMin(peer) {
    this.peerMin = peer
  }

  setPeerMax(peer) {
    this.peerMax = peer
  }

  resetToDefault() {
    this.underlying.value = this.defaultValue
  }

  set(value) {
    this.underlying.value = value
  }

  get() {
    return Number(this.underlying.value)
  }
}

// Dropdown element. At present, the value-list must be set within the calling HTML.
export class Dropdown extends GenericElement {
  constructor(elementID, callback) {
    super(elementID)

    // Browser-model element by composition
    this.underlying = _getElementById(elementID)

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.addEventListener("change", function(event) {
      const obj = this.parent // Map from browser-level up to class-level
      obj.callback(event)
    })
  }

  get() {
    return this.underlying.value
  }
}

// Dropdown element, with state retained in browser-local storage.
export class PersistentDropdown extends Dropdown {
  constructor(elementID, callback) {
    super(elementID, callback)

    this.localStorageKey = _localStorageKeyBase() + ":" + elementID + ":state"

    // Restore previous state upon construction
    const previousValue = localStorage.getItem(this.localStorageKey)
    if (previousValue != null) {
      this.underlying.value = previousValue
    }

    this.underlying.addEventListener("change", function(event) {
      const obj = this.parent // Map from browser-level up to class-level
      localStorage.setItem(obj.localStorageKey, event.target.value)
    })
  }
}

// One button, controlling which of two elements are visible.
// Nominal use is for hide/show.
export class OneButtonSwitcher {
  constructor(
    buttonElementID,
    itemList1, // TODO: assert each extends GenericElement
    itemList2, // TODO: assert each extends GenericElement
    itemList1ShownButtonText,
    itemList2ShownButtonText,
    callback,
  ) {
    this.button = new Button(buttonElementID, itemList1ShownButtonText, this.onClick)
    this.button.parent = this
    this.itemList1  = itemList1
    this.itemList2  = itemList2
    this.itemList1ShownButtonText = itemList1ShownButtonText
    this.itemList2ShownButtonText = itemList2ShownButtonText
    this.callback = callback
    this.show1()
  }

  which() {
    return this.whichShown
  }

  show1() {
    this.whichShown = 1
    this.itemList2.forEach((item) => item.makeInvisible())
    this.itemList1.forEach((item) => item.makeVisible())
    this.button.setTextContent(this.itemList1ShownButtonText)
  }

  show2() {
    this.whichShown = 2
    this.itemList1.forEach((item) => item.makeInvisible())
    this.itemList2.forEach((item) => item.makeVisible())
    this.button.setTextContent(this.itemList2ShownButtonText)
  }

  onClick(event) {
    // "this" is the Button; need to parent up to get the OneButtonSwitcher
    const obj = this.parent
    if (obj.whichShown == 1) {
      obj.show2()
    } else {
      obj.show1()
    }
    if (obj.callback != null) {
      obj.callback()
    }
  }
}

// N buttons, only one active
export class NButtonSelector {
  constructor(
    elementsConfig,
      // * Keys: element ID
      // * Values: objects with:
      //   o Key: "text",      Value: button text. Use null to leave it as specified in the HTML.
      //   o Key: "callback",  Value: application-level callback
    buttonSelectedStyle,
      // CSS class for selected button
    buttonDeselectedStyle,
      // CSS class for deselected button(s)
  ) {
    // Validate the first argument
    const callerName = "NButtonSelector"
    _assertIsMapObjectWithSubobjectKeys(
      elementsConfig,
      1,
      null,
      ["text", "callback"],
      callerName,
      "elementsConfig",
    )
    this.buttonSelectedStyle = buttonSelectedStyle
    this.buttonDeselectedStyle = buttonDeselectedStyle

    // * Instantiate the button objects, each with their callback closures
    // * Remember the app-level callbacks for each button
    this.buttons = {}
    this.callbacks = {}
    Object.entries(elementsConfig).forEach(([elementID, elementConfig]) => {
      // This is a closure over the elementID
      this.buttons[elementID] = new Button(
        elementID,
        elementConfig["text"],
        (event) => {
          this.onClick(event, elementID)
        },
      )
      this.callbacks[elementID] = elementConfig["callback"]
    })

    // Select the first button by default. (This could be made another constructor argument.)
    const firstElementID = Object.keys(elementsConfig)[0]
    this.onClick(null, firstElementID)
  }

  which() {
    return this.whichButtonIDSelected
  }

  onClick(event, selectedButtonID) {
    // Remember this
    this.whichButtonIDSelected = selectedButtonID

    // Update CSS styles for selected & deselected buttons
    Object.entries(this.buttons).forEach(([buttonID, button]) => {
      if (buttonID == selectedButtonID) {
        button.underlying.classList.add(this.buttonSelectedStyle)
        button.underlying.classList.remove(this.buttonDeselectedStyle)
      } else {
        button.underlying.classList.remove(this.buttonSelectedStyle)
        button.underlying.classList.add(this.buttonDeselectedStyle)
      }
    })

    // App-level callback, if any
    if (this.callbacks[selectedButtonID] != null) {
      this.callbacks[selectedButtonID](event)
    }
  }
}

// N buttons, controlling which element is visible.
export class NButtonSwitcher extends NButtonSelector{
  constructor(
    elementsConfig,
      // * Keys: element ID
      // * Values: objects with:
      //   o Key: "text",        Value: button text. Use null to leave it as specified in the HTML.
      //   o Key: "callback",    Value: application-level callback
      //   o Key: "items",       Value: array of objects inheriting from GenericElement
    buttonSelectedStyle,
      // CSS class for selected button
    buttonDeselectedStyle,
      // CSS class for deselected button(s)
  ) {
    super(elementsConfig, buttonSelectedStyle, buttonDeselectedStyle)

    // Validate the first argument
    const callerName = "NButtonSwitcher"
    _assertIsMapObjectWithSubobjectKeys(
      elementsConfig,
      1,
      null,
      ["text", "callback", "items"],
      callerName,
      "elementsConfig",
    )

    // Remember the item-list whose visibilities each button controls
    this.itemLists = {}
    Object.entries(elementsConfig).forEach(([elementID, elementConfig]) => {
      this.itemLists[elementID] = elementConfig["items"]
    })

    // Select the first button by default. (This could be made another constructor argument.)
    const firstElementID = Object.keys(elementsConfig)[0]
    this.onClick(null, firstElementID)
  }

  onClick(event, selectedButtonID) {
    if (this.itemLists == null) {
      return // At construction time
    }

    super.onClick(event, selectedButtonID)

    // Set visibilities of controlled items.
    //
    // This assumes controlled items are mutually exclusive. For
    // example, if there are three buttons A, B, and C, with buttons
    // A and B controlling element X, element X won't be shown in both cases.
    Object.entries(this.itemLists).forEach(([buttonID, itemList]) => {
      if (buttonID == selectedButtonID) {
        itemList.forEach((item) => item.makeVisible())
      } else {
        itemList.forEach((item) => item.makeInvisible())
      }
    })

  }
}

// Same as NButtonSwitcher, with local-storage memory of previous state
export class PersistentNButtonSwitcher extends NButtonSwitcher {
  constructor(
    elementsConfig,
    buttonSelectedStyle,
    buttonDeselectedStyle,
  ) {
    super(elementsConfig, buttonSelectedStyle, buttonDeselectedStyle)
    const firstElementID = Object.keys(elementsConfig)[0]
    this.localStorageKey = _localStorageKeyBase() + ":" + firstElementID + ":state"

    // Restore previous state upon construction
    const previousButtonIDSelected = localStorage.getItem(this.localStorageKey)
    if (previousButtonIDSelected != null) {
      this.whichButtonIDSelected = previousButtonIDSelected
      this.onClick(null, previousButtonIDSelected)
    }

    // Set local storage when any of the buttons is selected
    Object.entries(this.buttons).forEach(([buttonID, button]) => {
      button.underlying.addEventListener(
        "click",
        (event) => {
          // This is a closure over the buttonID
          localStorage.setItem(this.localStorageKey, buttonID)
        },
      )
    })
  }
}

// N buttons, controlling which elements are visible. Like NButtonSwitcher,
// except that there are also expand-all and collapse-all buttons, and
// there is the ability to show none of the options.
export class NButtonToggler {
  constructor(
    elementsConfig,
      // Keys: button element ID
      // Values: objects with:
      // * Key: "text",      Value: button text. Use null to leave it as specified in the HTML.
      // * Key: "items",     Value: array of objects inheriting from GenericElement
      // * Key: "callback",  Value: application-level callback
      //
      // Example:
      //  {
      //    "toggler-button-1": {
      //      "text": "Section 1",
      //      "items": [ new GenericElement("toggler-section-1") ],
      //    },
      //    ...
      //  }
      //
      // Please also see the sample app.
    expandAllConfig,
      // Single key-value pair: button elementID -> "text" key-value pair
    collapseAllConfig,
      // Single key-value pair: button elementID -> "text" key-value pair
    buttonSelectedStyle,
      // CSS class for selected button
    buttonDeselectedStyle,
      // CSS class for deselected button(s)
  ) {
    // Validate the arguments
    const callerName = "NButtonToggler"

    // Check shapes of config arguments.
    _assertIsMapObjectWithSubobjectKeys(elementsConfig, 1, null, ["text", "items", "callback"], callerName, "elementsConfig")
    _assertIsMapObjectWithSubobjectKeys(expandAllConfig,   1, 1, ["text"], callerName, "expandAllConfig")
    _assertIsMapObjectWithSubobjectKeys(collapseAllConfig, 1, 1, ["text"], callerName, "collapseAllConfig")

    this.buttonSelectedStyle   = buttonSelectedStyle
    this.buttonDeselectedStyle = buttonDeselectedStyle

    // Instantiate the button objects, each with their callback closures.
    // Remember the item-list each button controls.
    this.buttons = {}
    this.itemLists = {}
    Object.entries(elementsConfig).forEach(([buttonID, elementConfig]) => {
      // This is a closure over the buttonID
      this.buttons[buttonID] = new Button(
        buttonID,
        elementConfig["text"],
        (event) => {
          this.onClick(buttonID)
        },
      )
      this.itemLists[buttonID] = elementConfig["items"]
    })

    // Expand-all button
    const expandAllButtonElementID = Object.keys(expandAllConfig)[0]
    this.expandAllButton = new Button(
      expandAllButtonElementID,
      expandAllConfig[expandAllButtonElementID]["text"],
      () => {
        this.expandAll()
      },
    )
    const eau = this.expandAllButton.underlying
    eau.classList.remove(this.buttonSelectedStyle)
    eau.classList.add(this.buttonDeselectedStyle)

    // Collapse-all button
    const collapseAllButtonElementID = Object.keys(collapseAllConfig)[0]
    this.collapseAllButton = new Button(
      collapseAllButtonElementID,
      collapseAllConfig[collapseAllButtonElementID]["text"],
      () => {
        this.collapseAll()
      },
    )
    const cau = this.collapseAllButton.underlying
    cau.classList.remove(this.buttonSelectedStyle)
    cau.classList.add(this.buttonDeselectedStyle)

    this.visibilities = {}
    Object.entries(elementsConfig).forEach(([buttonID, elementConfig]) => {
      this.visibilities[buttonID] = false
    })
    // Select the first button by default.
    const firstButtonID = Object.keys(elementsConfig)[0]
    this.visibilities[firstButtonID] = true
    this.setFromVisibilities()
  }

  setFromVisibilities() {
    Object.entries(this.visibilities).forEach(([buttonID, visible]) => {
      if (visible) {
        this.showButtonContents(buttonID)
      } else {
        this.hideButtonContents(buttonID)
      }
    })
  }

  showButtonContents(buttonID) {
    // Controlled-widget styles
    const itemList = this.itemLists[buttonID]
    itemList.forEach((item) => { item.makeVisible() })
    // Controller-button styles
    const button = this.buttons[buttonID]
    button.underlying.classList.add(this.buttonSelectedStyle)
    button.underlying.classList.remove(this.buttonDeselectedStyle)
    // Our memory
    this.visibilities[buttonID] = true
  }

  hideButtonContents(buttonID) {
    // Controlled-widget styles
    const itemList = this.itemLists[buttonID]
    itemList.forEach((item) => { item.makeInvisible() })
    // Controller-button styles
    const button = this.buttons[buttonID]
    button.underlying.classList.remove(this.buttonSelectedStyle)
    button.underlying.classList.add(this.buttonDeselectedStyle)
    // Our memory
    this.visibilities[buttonID] = false
  }

  onClick(buttonID) {
    // If all are selected: select the current one and deselect the others.
    // If the current one is selected: deselect it and the others.
    // If the current one is deselected: select it, and deselect the others.

    if (Object.values(this.visibilities).every((visibility) => visibility == true)) {
      this.showButtonContents(buttonID)
    } else if (this.visibilities[buttonID] === true) {
      this.hideButtonContents(buttonID)
    } else if (this.visibilities[buttonID] === false) {
      this.showButtonContents(buttonID)
    } else {
      throw new Error("Internal coding error detected")
    }
    Object.keys(this.visibilities).forEach((otherButtonID) => {
      if (otherButtonID != buttonID) {
        this.hideButtonContents(otherButtonID)
      }
    })
  }

  // Not used as of this writing (2025-01-11), although it seems
  // worth keeping around.
  // This allows setting each of the visibilities independently.
  toggleButtonContents(buttonID) {
    if (this.visibilities[buttonID] === true) {
      this.hideButtonContents(buttonID)
    } else if (this.visibilities[buttonID] === false) {
      this.showButtonContents(buttonID)
    } else {
      throw new Error("Internal coding error detected")
    }
  }

  expandAll() {
    Object.keys(this.visibilities).forEach((buttonID) => {
      this.showButtonContents(buttonID)
    })
  }

  collapseAll() {
    Object.keys(this.visibilities).forEach((buttonID) => {
      this.hideButtonContents(buttonID)
    })
  }

}

// Same as NButtonToggler but uses browser-local storage to remember previous state.
export class PersistentNButtonToggler extends NButtonToggler {
  constructor(
    // All arguments as in NButtonToggler:
    elementsConfig,
    expandAllConfig,
    collapseAllConfig,
    buttonSelectedStyle,
    buttonDeselectedStyle,
  ) {
    super(elementsConfig, expandAllConfig, collapseAllConfig, buttonSelectedStyle, buttonDeselectedStyle)

    const firstButtonID = Object.keys(elementsConfig)[0]
    this.localStorageKey = _localStorageKeyBase() + ":" + firstButtonID + ":state"
    this.restoreFromLocalStorage()
  }

  restoreFromLocalStorage () {
    if (localStorage == null) {
      return
    }
    const value = localStorage.getItem(this.localStorageKey);
    if (value == null) {
      return
    }

    // This needs some checking in case new buttons were added/removed since
    // the last save to local storage.
    const savedVisibilities = JSON.parse(value)

    let newVisibilities = {...this.visibilities}
    Object.entries(this.visibilities).forEach(([elementID, currentVisibility]) => {
      if (savedVisibilities[elementID] != null) {
        newVisibilities[elementID] = savedVisibilities[elementID]
      }
    })

    this.visibilities = newVisibilities
    this.setFromVisibilities()
  }

  showButtonContents(buttonID) {
    super.showButtonContents(buttonID)
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.visibilities))
  }

  hideButtonContents(buttonID) {
    super.hideButtonContents(buttonID)
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.visibilities))
  }
}

// Same as PersistentNButtonToggler but allows text like "?foo" in the URL
// to specify which areas are visible. This makes togger-enabled pages bookmarkable.
// If there are no query-strings in the URL, the local storage is consulted for
// initial state, as in the parent class.
export class URLAndPersistentNButtonToggler extends PersistentNButtonToggler {
  constructor(
    // All arguments as in NButtonToggler, except elementsConfig values can also have
    // a "urlShorthand" key.
    elementsConfig,
      //
      // Example:
      //  {
      //    "toggler-button-1": {
      //      "text": "Section 1",
      //      "items": [ new GenericElement("toggler-section-1") ],
      //      "urlShorthand": "section1",
      //    },
      //    ...
      //  }
      //
      // Please also see the sample app.
    expandAllConfig,
    collapseAllConfig,
    buttonSelectedStyle,
    buttonDeselectedStyle,
  ) {
    super(elementsConfig, expandAllConfig, collapseAllConfig, buttonSelectedStyle, buttonDeselectedStyle)

    // Extract the urlShorthands column out of the elementsConfig.
    let urlShorthands = {}
    Object.entries(elementsConfig).forEach(([elementID, elementConfig]) => {
      let urlShorthand = elementConfig["urlShorthand"]
      if (urlShorthand != null) {
        urlShorthands[urlShorthand] = elementID
      }
    })

    const urlParams = new URLSearchParams(window.location.search);
    let foundAny = false
    let urlVisibilities = {}
    Object.entries(this.visibilities).forEach(([elementID, visibility]) => {
      urlVisibilities[elementID] = false
    })

    for (let key of urlParams.keys()) {
      const desiredButtonID = urlShorthands[key]
      if (desiredButtonID != null) {
        urlVisibilities[desiredButtonID] = true
        foundAny = true
      }
    }

    if (foundAny) {
      this.visibilities = {...urlVisibilities}
      this.setFromVisibilities()
    }
  }
}

// WIP: simple data table. Create with column headers. Add rows one at a time, with reset.
// TODO: rename to SimpleDataTable or somesuch?
// TODO: td not a single classname per column but rather a classname rule
// TODO: sort-by configs ..... maybe a subclass ....... ?
// TODO: cellRenderers
export class Table extends GenericElement {
  constructor(
    elementID,
    // TODO: move columnNames to be 2nd arg
    classNames, // Keys: "table", "tr", "th", "td"
    // TODO: classNameRules for th and td
    columnNames, // List
    cellRenderers, // Keys: from among classNames. Not used yet.
  ) {
    super(elementID)
    this.classNames    = {...classNames}
    this.columnNames   = [...columnNames]
    this.cellRenderers = {...cellRenderers}

    this.reset()
  }

  reset() {
    this.underlying.innerHTML = ''
    let c = this.classNames["table"]
    // TODO: methodize
    if (c != null) {
      this.underlying.setAttribute('class', c)
    }

    const headerRow = this.underlying.insertRow()
    this.columnNames.forEach((columnName) => {
      const headerCell = document.createElement('th')
      let c = this.classNames["th"]
      if (c != null) {
        headerCell.setAttribute('class', c)
      }
      headerCell.innerHTML = columnName
      headerRow.appendChild(headerCell)
    })

  }

  put(dataRows) {
    dataRows.forEach((dataRow) => {
      const tableRow = this.underlying.insertRow()
      let c = this.classNames["tr"]
      if (c != null) {
        tableRow.setAttribute('class', c)
      }

      dataRow.forEach((dataCell) => {
        const tableCell = tableRow.insertCell()
        tableCell.innerHTML = dataCell
        let c = this.classNames["td"]
        if (c != null) {
          tableCell.setAttribute('class', c)
        }
      })
    })
  }

// TODO:
//      config.forEach(item => {
//        const cell = row.insertCell()
//        const rawValue = dataRow[item.attributeName]
//        const cellRenderer = item.cellRenderer
//        const formattedValue = cellRenderer != null
//          ? cellRenderer(rawValue)
//          : rawValue
//        cell.innerHTML = formattedValue
//        if (item.classNameRule != null) {
//          const className = item.classNameRule(rawValue)
//          if (className != null) {
//            cell.setAttribute('class', className)
//          }
//        }
//      })

}

// This wraps a range input.
export class RangeSlider extends GenericElement {
  constructor(
    elementID,
    minValue,
    startValue,
    maxValue,
    callback,
    valueDisplayElementID, // optional: element to write the new value
    valueDisplayFormatter, // optional
  ) {
    super(elementID)

    this.underlying.min = minValue
    this.underlying.value = startValue
    this.underlying.max = maxValue

    this.callback = callback

    if (valueDisplayElementID == null) {
      this.valueDisplayElement = null
    } else {
      this.valueDisplayElement = new TextSpan(valueDisplayElementID, startValue)
    }
    if (valueDisplayFormatter == null) {
      this.valueDisplayFormatter = (x) => x
    } else {
      this.valueDisplayFormatter = valueDisplayFormatter
    }

    // Return the range-slider value
    this.underlying.addEventListener(
      'input',
      (event) => {
        this.set(this.underlying.value)
        return this.callback(this.get())
      }
    )
  }

  get() {
    return this.underlying.value
  }

  set(value) {
    this.underlying.value = value
    if (this.valueDisplayElement != null) {
      this.valueDisplayElement.set(this.valueDisplayFormatter(this.get()))
    }
  }
}

// This wraps a range input, but allows encapsulated remap to floating-point range.
export class RangeFloatSlider extends GenericElement {
  constructor(
    elementID,
    minFloatValue,   // floating-point
    startFloatValue, // floating-point
    maxFloatValue,   // floating-point
    numPoints,       // since this underlying widget is integer-onLy
    callback,
    valueDisplayElementID, // optional: element to write the new value
    valueDisplayFormatter, // optional
  ) {
    super(elementID)

    // Integers
    this.underlying.min = 0
    this.underlying.value = (startFloatValue - minFloatValue) / (maxFloatValue - minFloatValue) * numPoints
    this.underlying.max = numPoints

    // Floating-point: use underlying integers as scale into user-provided float bounds
    this.numPoints = numPoints
    this.minFloatValue = minFloatValue
    this.maxFloatValue = maxFloatValue
    this.diff = maxFloatValue - minFloatValue

    this.callback = callback

    if (valueDisplayElementID == null) {
      this.valueDisplayElement = null
    } else {
      this.valueDisplayElement = new TextSpan(valueDisplayElementID, startFloatValue)
    }
    if (valueDisplayFormatter == null) {
      this.valueDisplayFormatter = (x) => x
    } else {
      this.valueDisplayFormatter = valueDisplayFormatter
    }

    // Return the range-slider value
    this.underlying.addEventListener(
      'input',
      (event) => {
        this.set(this.get())
        return this.callback(this.get())
      }
    )
  }

  get() {
    return this.minFloatValue + this.underlying.value / this.numPoints * this.diff
  }

  set(floatValue) {
    this.underlying.value = (floatValue - this.minFloatValue) / this.diff * this.numPoints
    if (this.valueDisplayElement != null) {
      this.valueDisplayElement.set(this.valueDisplayFormatter(this.get()))
    }
  }
}

// ----------------------------------------------------------------
// FUNCTIONS

// The app should have a div (or span, your choice) with the specified
// container ID. Within that there should be another div/span which is
// where the error text will be written.
//
// This function does the following:
// * Initially:
//   o Makes the container invisible.
//   o Makes the text empty.
// * On error:
//   o Makes the container visible.
//   o Writes the error text to the specified element.
// * Left up to the calling app:
//   o Any CSS styling for the error-container
//   o Any other widgets within the error-container, e.g. a button to clear them.
export function setErrorWidget(containerElementID, textElementID) {
  let containerElement = _getElementById(containerElementID)
  let textElement = _getElementById(textElementID)
  if (containerElement == null) {
    console.log('Sliver: cannot find element "' + containerElementID + '" to set for showing error messages')
    return false
  }
  if (textElement == null) {
    console.log('Sliver: cannot find element "' + textElementID + '" to set for showing error messages')
    return false
  }

  containerElement.style.display = "none"
  textElement.innerHTML = ""
  window.onerror = function(message, source, lineno, colno, error) {
    // This is a closure over containerElement and textElement.
    let msg = "Error at " + source + ':' + lineno + ':' + colno + ':<br/>"' + message + '"'
    console.error(msg)
    console.log(error.stack)
    containerElement.style.display = "block"
    textElement.innerHTML = msg
    // Prevent the default error-handling behavior
    return true;
  }
}

// ----------------------------------------------------------------
// UTILITIES

export function isInteger(text) {
  // TODO: this accepts '3.4' and should not
  return !isNaN(parseInt(text))
}

// ----------------------------------------------------------------
// INTERNALS

function _getElementById(elementID) {
  const element = document.getElementById(elementID)
  if (element == null) {
    throw new Error('Element ID "' + elementID + '" not found in document.')
  }
  return element
}

function _assertIsMapObject(o, callerName, thingName) {
  if (!o instanceof Object) {
    throw new Error(callerName + ": " + thingName + " is not a object")
  }
  if (o instanceof Array) {
    throw new Error(callerName + ": " + thingName + " is an array, not a non-array object")
  }
}

function _objectLength(o) {
  return Object.keys(o).length
}

function _assertIsNonEmptyMapObject(o, callerName, thingName) {
  _assertIsMapObject(o, callerName, thingName)
  if (_objectLength(o) <= 0) {
    throw new Error(callerName + ": " + thingName + " is empty")
  }
}

function _assertIsMapObjectWithSubobjectKeys(
  o,
  minLength, // maybe null
  maxLength, // maybe null
  expectedSubobjectKeys,
  callerName,
  thingName,
) {
  _assertIsNonEmptyMapObject(o, callerName, thingName)
  Object.entries(o).forEach(([key, subobject]) => {
    _assertIsMapObjectWithKeys(subobject, expectedSubobjectKeys, callerName, thingName + ":" + key)
  })

  let olen = _objectLength(o)
  if (minLength != null && olen < minLength) {
    throw new Error(callerName + ": " + thingName + " has length " + olen + "; expected >= ", minLength)
  }
  if (maxLength != null && olen > maxLength) {
    throw new Error(callerName + ": " + thingName + " has length " + olen + "; expected <= ", maxLength)
  }
}

function _arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false
  }
  return a.every((element, index) => element === b[index]);
}

function _assertIsMapObjectWithKeys(o, keys, callerName, thingName) {
  _assertIsMapObject(o, callerName, thingName)
  const actualKeys = Object.keys(o).toSorted()
  const expectedKeys = keys.toSorted()
  const actualKeysSet = new Set(actualKeys)
  const expectedKeysSet = new Set(expectedKeys)
  if (!expectedKeysSet.isSubsetOf(actualKeysSet)) {
    throw new Error(
      callerName
      + ': '
      + thingName
      + ' must have keys "'
      // XXX B04K w/ SETS
      + JSON.stringify(expectedKeys)
      + '"; got "'
      + JSON.stringify(actualKeys)
    )
  }
}

// document.URL also works, but it may have query strings like https://site.org?foo=bar.
// We want just the https://site.org bit.
function _localStorageKeyBase() {
  return window.location.origin + window.location.pathname
}
