"use strict";

// ----------------------------------------------------------------
// WIDGET CLASSES

// This wraps any DOM element, making it hideable and focusable.
// This is just a keystroke-saver.
export class GenericElement {
  constructor(
    elementID,
  ) {
    this.underlying = document.getElementById(elementID)
  }

  makeVisible() {
    // Null is best for show/hide of table rows/cells, vs. "block" or "inline"
    this.underlying.style.display = null
  }

  makeInvisible() {
    this.underlying.style.display = "none"
  }

  focus() {
    this.underlying.focus()
  }
}

// This is a standard slider, nominally for light-theme/dark-theme selector.
export class Slider extends GenericElement {
  constructor(
    sliderElementID,
    labelElementID,
    isUncheckedLabel,
    isCheckedLabel,
    toUncheckedCallback,
    toCheckedCallback,
  ) {
    super()

    // Browser-model element by composition
    // * Underlying unchecked = slider left = light theme
    // * Underlying checked   = slider left = dark  theme
    this.underlyingSlider = document.getElementById(sliderElementID)
    this.underlyingLabel  = document.getElementById(labelElementID)
    // This lets underlying-level callbacks invoke our methods
    this.underlyingSlider.parent = this

    this.isUncheckedLabel    = isUncheckedLabel
    this.isCheckedLabel      = isCheckedLabel
    this.toUncheckedCallback = toUncheckedCallback
    this.toCheckedCallback   = toCheckedCallback

    this.underlyingSlider.addEventListener("change", function(e) {
      let obj = this.parent // Map from browser-level up to class-level
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
export class PersistentSlider extends Slider {

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

    this.localStorageKey = document.URL + ":" + sliderElementID + ":checked"

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

// Specialization of PersistentSlider for a light-theme/dark-theme slider.
// Just a keystroke-saver.
export class LightDarkThemeSlider extends PersistentSlider {
  // Lightly decorates PersistentSlider by adding labels
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
    callback,
  ) {
    super()

    // Browser-model element by composition
    this.underlying = document.getElementById(elementID)
    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.textContent = text

    this.underlying.addEventListener("click", function(event) {
      let obj = this.parent // Map from browser-level up to class-level
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
    super()

    // Browser-model element by composition
    this.underlying = document.getElementById(elementID)

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.addEventListener("input", function(event) {
      let obj = this.parent // Map from browser-level up to class-level
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
    super()

    // Browser-model element by composition
    this.underlying = document.getElementById(elementID)

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.constrainerCallback = constrainerCallback
    this.eventCallback = eventCallback

    this.underlying.addEventListener("input", function(event) {
      let obj = this.parent // Map from browser-level up to class-level
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
    super()
    // Browser-model element by composition
    this.underlying = document.getElementById(elementID)
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
    super()

    this.defaultValue = defaultValue
    // Min/max values for this widget:
    this.minAllowable = minAllowable
    this.maxAllowable = maxAllowable
    // Another IntRangeInput we're coupled to:
    this.peerMin = null
    this.peerMax = null

    // Browser-model element by composition
    this.underlying = document.getElementById(elementID)
    this.underlying.value = this.defaultValue

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.addEventListener("change", function(event) {
      let obj = this.parent // Map from browser-level up to class-level

      // The up-and-down sliders won't let the user choose outside the widget's min/max.
      // But the user can still type "999" or "aaa" into the widget. Here we protect against this.
      if (!isInteger(event.target.value)) {
        obj.underlying.value = obj.defaultValue
      } else {
        let requestedValue = Number(event.target.value)

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

  get() {
    return Number(this.underlying.value)
  }
}

// Dropdown element. At present, the value-list must be set within the calling HTML.
export class Dropdown extends GenericElement {
  constructor(elementID, callback) {
    super()

    // Browser-model element by composition
    this.underlying = document.getElementById(elementID)

    // This lets underlying-level callbacks invoke our methods
    this.underlying.parent = this
    this.callback = callback

    this.underlying.addEventListener("change", function(event) {
      let obj = this.parent // Map from browser-level up to class-level
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

    this.localStorageKey = document.URL + ":" + elementID + ":state"

    // Restore previous state upon construction
    let previousValue = localStorage.getItem(this.localStorageKey)
    if (previousValue != null) {
      this.underlying.value = previousValue
    }

    this.underlying.addEventListener("change", function(event) {
      let obj = this.parent // Map from browser-level up to class-level
      localStorage.setItem(obj.localStorageKey, event.target.value)
    })
  }
}

// One button, controlling which of two elements are visible.
export class OneButtonSwitcher {
  constructor(
    buttonElementID,
    itemList1, // TODO: assert each extends GenericElement
    itemList2, // TODO: assert each extends GenericElement
    itemList1ShownButtonText,
    itemList2ShownButtonText,
    appCallback,
  ) {
    this.button = new Button(buttonElementID, itemList1ShownButtonText, this.onClick)
    this.button.parent = this
    this.itemList1  = itemList1
    this.itemList2  = itemList2
    this.itemList1ShownButtonText = itemList1ShownButtonText
    this.itemList2ShownButtonText = itemList2ShownButtonText
    this.appCallback = appCallback
    this.show1()
  }

  which() {
    return this.whichShown
  }

  show1() {
    this.whichShown = 1
    this.itemList1.forEach((item) => item.makeVisible())
    this.itemList2.forEach((item) => item.makeInvisible())
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
    let obj = this.parent
    if (obj.whichShown == 1) {
      obj.show2()
    } else {
      obj.show1()
    }
    if (obj.appCallback != null) {
      obj.appCallback()
    }
  }
}

// N buttons, controlling which elements are visible.
export class NButtonSwitcher {
  constructor(
    elementsObject,
      // * Keys: element ID
      // * Values: objects with:
      //   o Key: "text",        Value: button text
      //   o Key: "items",       Value: array of objects inheriting from GenericElement
      //   o Key: "appCallback", Value: application-level callback
    buttonSelectedStyle,
      // CSS class for selected button
    buttonDeselectedStyle,
      // CSS class for deselected button(s)
  ) {
    // Validate the first argument

    // First validate the base object. Note that JS says true for arrays here, so this is
    // not a perfect check.
    if (!elementsObject instanceof Object) {
      throw new Error("NButtonSwitcher: elementsObject is not an object")
    }
    if (elementsObject.length <= 0) {
      throw new Error("NButtonSwitcher: elementsObject is empty")
    }
    // Validate the sub-objects.
    Object.entries(elementsObject).forEach(([elementID, elementObject]) => {
      if (typeof(elementID) != "string") {
        throw new Error("NButtonSwitcher: elementsObject keys are not all strings")
      }
      if (elementObject["text"] == undefined
        || elementObject["items"] == undefined
        || elementObject["appCallback"] == undefined
      ) {
        throw new Error('NButtonSwitcher: elementsObject values must have keys "text", "items", "appCallback"')
      }
    })

    // Now:
    // * Instantiate the button objects, each with their callback closures
    // * Remember the item-list each button controls
    // * Remember the app-level callbacks for each button
    this.buttons = {}
    this.itemLists = {}
    this.appCallbacks = {}
    Object.entries(elementsObject).forEach(([elementID, elementObject]) => {
      // This is a closure over the elementID
      let text = elementObject["text"]
      let itemList = elementObject["items"]
      let appCallback = elementObject["appCallback"]
      let button = new Button(
        elementID,
        text,
        (event) => {
          this.show(event, elementID)
        },
      )
      this.buttons[elementID] = button
      this.itemLists[elementID] = itemList
      this.appCallbacks[elementID] = appCallback
    })

    this.buttonSelectedStyle = buttonSelectedStyle
    this.buttonDeselectedStyle = buttonDeselectedStyle

    // Select the first button by default. (This could be made another constructor argument.)
    let firstElementID = Object.keys(elementsObject)[0]
    this.whichButtonIDSelected = firstElementID
    this.show(null, firstElementID)
  }

  which() {
    return this.whichButtonIDSelected
  }

  show(event, selectedButtonID) {
    // Remember this
    this.whichButtonIDSelected = selectedButtonID

    // Set visibilities of controlled items
    Object.entries(this.itemLists).forEach(([buttonID, itemList]) => {
      if (buttonID == selectedButtonID) {
        itemList.forEach((item) => item.makeVisible())
      } else {
        itemList.forEach((item) => item.makeInvisible())
      }
    })

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
    if (this.appCallbacks[selectedButtonID] != null) {
      this.appCallbacks[selectedButtonID](event)
    }
  }
}

// Same as NButtonSwitcher, with local-storage memory of previous state
export class PersistentNButtonSwitcher extends NButtonSwitcher {
  constructor(
    elementsObject,
    buttonSelectedStyle,
    buttonDeselectedStyle,
  ) {
    super(elementsObject, buttonSelectedStyle, buttonDeselectedStyle)
    let firstElementID = Object.keys(elementsObject)[0]
    this.localStorageKey = document.URL + ":" + firstElementID + ":state"

    // Restore previous state upon construction
    let previousButtonIDSelected = localStorage.getItem(this.localStorageKey)
    if (previousButtonIDSelected != null) {
      this.whichButtonIDSelected = previousButtonIDSelected
      this.show(null, previousButtonIDSelected)
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

export function setErrorWidget(elementID) {
  let element = document.getElementById(elementID)
  if (element == null) {
    console.log('Sliver: cannot find element "' + elementID + '" to set for showing error messages')
    return false
  }

  element.style.display = "none"
  window.onerror = function(message, source, lineno, colno, error) {
    let msg = "Error at " + source + ':' + lineno + ':' + colno + ':<br/>"' + message + '"'
    console.error(msg)
    element.style.display = "block"
    element.innerHTML = msg
    // Prevent the default error-handling behavior
    return true;
  }
}

// ----------------------------------------------------------------
// UTILITIES

// TODO:
// * assertor for non-null (e.g. get-element-by-id)

export function isInteger(text) {
  // TODO: this accepts '3.4' and should not
  return !isNaN(parseInt(text))
}
