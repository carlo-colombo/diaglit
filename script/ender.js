/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build diaglit
  * =============================================================
  */

/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011-2012 (@ded @fat)
  * http://ender.jit.su
  * License MIT
  */
(function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context['$']
    , oldEnder = context['ender']
    , oldRequire = context['require']
    , oldProvide = context['provide']

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules['$' + identifier] || window[identifier]
    if (!module) throw new Error("Ender Error: Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules['$' + name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  /**
   * main Ender return object
   * @constructor
   * @param {Array|Node|string} s a CSS selector or DOM node(s)
   * @param {Array.|Node} r a root node(s)
   */
  function Ender(s, r) {
    var elements
      , i

    this.selector = s
    // string || node || nodelist || window
    if (typeof s == 'undefined') {
      elements = []
      this.selector = ''
    } else if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      elements = ender._select(s, r)
    } else {
      elements = isFinite(s.length) ? s : [s]
    }
    this.length = elements.length
    for (i = this.length; i--;) this[i] = elements[i]
  }

  /**
   * @param {function(el, i, inst)} fn
   * @param {Object} opt_scope
   * @returns {Ender}
   */
  Ender.prototype['forEach'] = function (fn, opt_scope) {
    var i, l
    // opt out of native forEach so we can intentionally call our own scope
    // defaulting to the current item and be able to return self
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(opt_scope || this[i], this[i], i, this)
    // return self for chaining
    return this
  }

  Ender.prototype.$ = ender // handy reference to self


  function ender(s, r) {
    return new Ender(s, r)
  }

  ender['_VERSION'] = '0.4.3-dev'

  ender.fn = Ender.prototype // for easy compat to jQuery plugins

  ender.ender = function (o, chain) {
    aug(chain ? Ender.prototype : ender, o)
  }

  ender._select = function (s, r) {
    if (typeof s == 'string') return (r || document).querySelectorAll(s)
    if (s.nodeName) return [s]
    return s
  }


  // use callback to receive Ender's require & provide and remove them from global
  ender.noConflict = function (callback) {
    context['$'] = old
    if (callback) {
      context['provide'] = oldProvide
      context['require'] = oldRequire
      context['ender'] = oldEnder
      if (typeof callback == 'function') callback(require, provide, this)
    }
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = ender

}(this));

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bean - copyright (c) Jacob Thornton 2011-2012
    * https://github.com/fat/bean
    * MIT license
    */
  !(function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition(name, context);
    else if (typeof define == 'function' && typeof define.amd  == 'object') define(definition);
    else context[name] = definition(name, context);
  }('bean', this, function (name, context) {
    var win            = window
      , old            = context[name]
      , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
      , nameRegex      = /\..*/
      , addEvent       = 'addEventListener'
      , removeEvent    = 'removeEventListener'
      , doc            = document || {}
      , root           = doc.documentElement || {}
      , W3C_MODEL      = root[addEvent]
      , eventSupport   = W3C_MODEL ? addEvent : 'attachEvent'
      , ONE            = {} // singleton for quick matching making add() do one()
  
      , slice          = Array.prototype.slice
      , str2arr        = function (s, d) { return s.split(d || ' ') }
      , isString       = function (o) { return typeof o == 'string' }
      , isFunction     = function (o) { return typeof o == 'function' }
  
        // events that we consider to be 'native', anything not in this list will
        // be treated as a custom event
      , standardNativeEvents =
          'click dblclick mouseup mousedown contextmenu '                  + // mouse buttons
          'mousewheel mousemultiwheel DOMMouseScroll '                     + // mouse wheel
          'mouseover mouseout mousemove selectstart selectend '            + // mouse movement
          'keydown keypress keyup '                                        + // keyboard
          'orientationchange '                                             + // mobile
          'focus blur change reset select submit '                         + // form elements
          'load unload beforeunload resize move DOMContentLoaded '         + // window
          'readystatechange message '                                      + // window
          'error abort scroll '                                              // misc
        // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
        // that doesn't actually exist, so make sure we only do these on newer browsers
      , w3cNativeEvents =
          'show '                                                          + // mouse buttons
          'input invalid '                                                 + // form elements
          'touchstart touchmove touchend touchcancel '                     + // touch
          'gesturestart gesturechange gestureend '                         + // gesture
          'textinput'                                                      + // TextEvent
          'readystatechange pageshow pagehide popstate '                   + // window
          'hashchange offline online '                                     + // window
          'afterprint beforeprint '                                        + // printing
          'dragstart dragenter dragover dragleave drag drop dragend '      + // dnd
          'loadstart progress suspend emptied stalled loadmetadata '       + // media
          'loadeddata canplay canplaythrough playing waiting seeking '     + // media
          'seeked ended durationchange timeupdate play pause ratechange '  + // media
          'volumechange cuechange '                                        + // media
          'checking noupdate downloading cached updateready obsolete '       // appcache
  
        // convert to a hash for quick lookups
      , nativeEvents = (function (hash, events, i) {
          for (i = 0; i < events.length; i++) events[i] && (hash[events[i]] = 1)
          return hash
        }({}, str2arr(standardNativeEvents + (W3C_MODEL ? w3cNativeEvents : ''))))
  
        // custom events are events that we *fake*, they are not provided natively but
        // we can use native events to generate them
      , customEvents = (function () {
          var isAncestor = 'compareDocumentPosition' in root
                ? function (element, container) {
                    return container.compareDocumentPosition && (container.compareDocumentPosition(element) & 16) === 16
                  }
                : 'contains' in root
                  ? function (element, container) {
                      container = container.nodeType === 9 || container === window ? root : container
                      return container !== element && container.contains(element)
                    }
                  : function (element, container) {
                      while (element = element.parentNode) if (element === container) return 1
                      return 0
                    }
            , check = function (event) {
                var related = event.relatedTarget
                return !related
                  ? related == null
                  : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString())
                      && !isAncestor(related, this))
              }
  
          return {
              mouseenter: { base: 'mouseover', condition: check }
            , mouseleave: { base: 'mouseout', condition: check }
            , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
          }
        }())
  
        // we provide a consistent Event object across browsers by taking the actual DOM
        // event object and generating a new one from its properties.
      , Event = (function () {
              // a whitelist of properties (for different event types) tells us what to check for and copy
          var commonProps  = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget ' +
                'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey '  +
                'srcElement target timeStamp type view which propertyName')
            , mouseProps   = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer '      +
                'fromElement offsetX offsetY pageX pageY screenX screenY toElement'))
            , mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ ' +
                'axis')) // 'axis' is FF specific
            , keyProps     = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier '          +
                'keyLocation location'))
            , textProps    = commonProps.concat(str2arr('data'))
            , touchProps   = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation'))
            , messageProps = commonProps.concat(str2arr('data origin source'))
            , stateProps   = commonProps.concat(str2arr('state'))
            , overOutRegex = /over|out/
              // some event types need special handling and some need special properties, do that all here
            , typeFixers   = [
                  { // key events
                      reg: /key/i
                    , fix: function (event, newEvent) {
                        newEvent.keyCode = event.keyCode || event.which
                        return keyProps
                      }
                  }
                , { // mouse events
                      reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
                    , fix: function (event, newEvent, type) {
                        newEvent.rightClick = event.which === 3 || event.button === 2
                        newEvent.pos = { x: 0, y: 0 }
                        if (event.pageX || event.pageY) {
                          newEvent.clientX = event.pageX
                          newEvent.clientY = event.pageY
                        } else if (event.clientX || event.clientY) {
                          newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                          newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                        }
                        if (overOutRegex.test(type)) {
                          newEvent.relatedTarget = event.relatedTarget
                            || event[(type == 'mouseover' ? 'from' : 'to') + 'Element']
                        }
                        return mouseProps
                      }
                  }
                , { // mouse wheel events
                      reg: /mouse.*(wheel|scroll)/i
                    , fix: function () { return mouseWheelProps }
                  }
                , { // TextEvent
                      reg: /^text/i
                    , fix: function () { return textProps }
                  }
                , { // touch and gesture events
                      reg: /^touch|^gesture/i
                    , fix: function () { return touchProps }
                  }
                , { // message events
                      reg: /^message$/i
                    , fix: function () { return messageProps }
                  }
                , { // popstate events
                      reg: /^popstate$/i
                    , fix: function () { return stateProps }
                  }
                , { // everything else
                      reg: /.*/
                    , fix: function () { return commonProps }
                  }
              ]
            , typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism
  
            , Event = function (event, element, isNative) {
                if (!arguments.length) return
                event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event
                this.originalEvent = event
                this.isNative       = isNative
                this.isBean         = true
  
                if (!event) return
  
                var type   = event.type
                  , target = event.target || event.srcElement
                  , i, l, p, props, fixer
  
                this.target = target && target.nodeType === 3 ? target.parentNode : target
  
                if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
                  fixer = typeFixerMap[type]
                  if (!fixer) { // haven't encountered this event type before, map a fixer function for it
                    for (i = 0, l = typeFixers.length; i < l; i++) {
                      if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
                        typeFixerMap[type] = fixer = typeFixers[i].fix
                        break
                      }
                    }
                  }
  
                  props = fixer(event, this, type)
                  for (i = props.length; i--;) {
                    if (!((p = props[i]) in this) && p in event) this[p] = event[p]
                  }
                }
              }
  
          // preventDefault() and stopPropagation() are a consistent interface to those functions
          // on the DOM, stop() is an alias for both of them together
          Event.prototype.preventDefault = function () {
            if (this.originalEvent.preventDefault) this.originalEvent.preventDefault()
            else this.originalEvent.returnValue = false
          }
          Event.prototype.stopPropagation = function () {
            if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation()
            else this.originalEvent.cancelBubble = true
          }
          Event.prototype.stop = function () {
            this.preventDefault()
            this.stopPropagation()
            this.stopped = true
          }
          // stopImmediatePropagation() has to be handled internally because we manage the event list for
          // each element
          // note that originalElement may be a Bean#Event object in some situations
          Event.prototype.stopImmediatePropagation = function () {
            if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation()
            this.isImmediatePropagationStopped = function () { return true }
          }
          Event.prototype.isImmediatePropagationStopped = function () {
            return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
          }
          Event.prototype.clone = function (currentTarget) {
            //TODO: this is ripe for optimisation, new events are *expensive*
            // improving this will speed up delegated events
            var ne = new Event(this, this.element, this.isNative)
            ne.currentTarget = currentTarget
            return ne
          }
  
          return Event
        }())
  
        // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
      , targetElement = function (element, isNative) {
          return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
        }
  
        /**
          * Bean maintains an internal registry for event listeners. We don't touch elements, objects
          * or functions to identify them, instead we store everything in the registry.
          * Each event listener has a RegEntry object, we have one 'registry' for the whole instance.
          */
      , RegEntry = (function () {
          // each handler is wrapped so we can handle delegation and custom events
          var wrappedHandler = function (element, fn, condition, args) {
              var call = function (event, eargs) {
                    return fn.apply(element, args ? slice.call(eargs, event ? 0 : 1).concat(args) : eargs)
                  }
                , findTarget = function (event, eventElement) {
                    return fn.__beanDel ? fn.__beanDel.ft(event.target, element) : eventElement
                  }
                , handler = condition
                    ? function (event) {
                        var target = findTarget(event, this) // deleated event
                        if (condition.apply(target, arguments)) {
                          if (event) event.currentTarget = target
                          return call(event, arguments)
                        }
                      }
                    : function (event) {
                        if (fn.__beanDel) event = event.clone(findTarget(event)) // delegated event, fix the fix
                        return call(event, arguments)
                      }
              handler.__beanDel = fn.__beanDel
              return handler
            }
  
          , RegEntry = function (element, type, handler, original, namespaces, args, root) {
              var customType     = customEvents[type]
                , isNative
  
              if (type == 'unload') {
                // self clean-up
                handler = once(removeListener, element, type, handler, original)
              }
  
              if (customType) {
                if (customType.condition) {
                  handler = wrappedHandler(element, handler, customType.condition, args)
                }
                type = customType.base || type
              }
  
              this.isNative      = isNative = nativeEvents[type] && !!element[eventSupport]
              this.customType    = !W3C_MODEL && !isNative && type
              this.element       = element
              this.type          = type
              this.original      = original
              this.namespaces    = namespaces
              this.eventType     = W3C_MODEL || isNative ? type : 'propertychange'
              this.target        = targetElement(element, isNative)
              this[eventSupport] = !!this.target[eventSupport]
              this.root          = root
              this.handler       = wrappedHandler(element, handler, null, args)
            }
  
          // given a list of namespaces, is our entry in any of them?
          RegEntry.prototype.inNamespaces = function (checkNamespaces) {
            var i, j, c = 0
            if (!checkNamespaces) return true
            if (!this.namespaces) return false
            for (i = checkNamespaces.length; i--;) {
              for (j = this.namespaces.length; j--;) {
                if (checkNamespaces[i] == this.namespaces[j]) c++
              }
            }
            return checkNamespaces.length === c
          }
  
          // match by element, original fn (opt), handler fn (opt)
          RegEntry.prototype.matches = function (checkElement, checkOriginal, checkHandler) {
            return this.element === checkElement &&
              (!checkOriginal || this.original === checkOriginal) &&
              (!checkHandler || this.handler === checkHandler)
          }
  
          return RegEntry
        }())
  
      , registry = (function () {
          // our map stores arrays by event type, just because it's better than storing
          // everything in a single array.
          // uses '$' as a prefix for the keys for safety and 'r' as a special prefix for
          // rootListeners so we can look them up fast
          var map = {}
  
            // generic functional search of our registry for matching listeners,
            // `fn` returns false to break out of the loop
            , forAll = function (element, type, original, handler, root, fn) {
                var pfx = root ? 'r' : '$'
                if (!type || type == '*') {
                  // search the whole registry
                  for (var t in map) {
                    if (t.charAt(0) == pfx) {
                      forAll(element, t.substr(1), original, handler, root, fn)
                    }
                  }
                } else {
                  var i = 0, l, list = map[pfx + type], all = element == '*'
                  if (!list) return
                  for (l = list.length; i < l; i++) {
                    if ((all || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return
                  }
                }
              }
  
            , has = function (element, type, original, root) {
                // we're not using forAll here simply because it's a bit slower and this
                // needs to be fast
                var i, list = map[(root ? 'r' : '$') + type]
                if (list) {
                  for (i = list.length; i--;) {
                    if (!list[i].root && list[i].matches(element, original, null)) return true
                  }
                }
                return false
              }
  
            , get = function (element, type, original, root) {
                var entries = []
                forAll(element, type, original, null, root, function (entry) {
                  return entries.push(entry)
                })
                return entries
              }
  
            , put = function (entry) {
                var has = !entry.root && !this.has(entry.element, entry.type, null, false)
                  , key = (entry.root ? 'r' : '$') + entry.type
                ;(map[key] || (map[key] = [])).push(entry)
                return has
              }
  
            , del = function (entry) {
                forAll(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                  list.splice(i, 1)
                  entry.removed = true
                  if (list.length === 0) delete map[(entry.root ? 'r' : '$') + entry.type]
                  return false
                })
              }
  
              // dump all entries, used for onunload
            , entries = function () {
                var t, entries = []
                for (t in map) {
                  if (t.charAt(0) == '$') entries = entries.concat(map[t])
                }
                return entries
              }
  
          return { has: has, get: get, put: put, del: del, entries: entries }
        }())
  
        // we need a selector engine for delegated events, use querySelectorAll if it exists
        // but for older browsers we need Qwery, Sizzle or similar
      , selectorEngine
      , setSelectorEngine = function (e) {
          if (!arguments.length) {
            selectorEngine = doc.querySelectorAll
              ? function (s, r) {
                  return r.querySelectorAll(s)
                }
              : function () {
                  throw new Error('Bean: No selector engine installed') // eeek
                }
          } else {
            selectorEngine = e
          }
        }
  
        // we attach this listener to each DOM event that we need to listen to, only once
        // per event type per DOM element
      , rootListener = function (event, type) {
          if (!W3C_MODEL && type && event && event.propertyName != '_on' + type) return
  
          var listeners = registry.get(this, type || event.type, null, false)
            , l = listeners.length
            , i = 0
  
          event = new Event(event, this, true)
          if (type) event.type = type
  
          // iterate through all handlers registered for this type, calling them unless they have
          // been removed by a previous handler or stopImmediatePropagation() has been called
          for (; i < l && !event.isImmediatePropagationStopped(); i++) {
            if (!listeners[i].removed) listeners[i].handler.call(this, event)
          }
        }
  
        // add and remove listeners to DOM elements
      , listener = W3C_MODEL
          ? function (element, type, add) {
              // new browsers
              element[add ? addEvent : removeEvent](type, rootListener, false)
            }
          : function (element, type, add, custom) {
              // IE8 and below, use attachEvent/detachEvent and we have to piggy-back propertychange events
              // to simulate event bubbling etc.
              var entry
              if (add) {
                registry.put(entry = new RegEntry(
                    element
                  , custom || type
                  , function (event) { // handler
                      rootListener.call(element, event, custom)
                    }
                  , rootListener
                  , null
                  , null
                  , true // is root
                ))
                if (custom && element['_on' + custom] == null) element['_on' + custom] = 0
                entry.target.attachEvent('on' + entry.eventType, entry.handler)
              } else {
                entry = registry.get(element, custom || type, rootListener, true)[0]
                if (entry) {
                  entry.target.detachEvent('on' + entry.eventType, entry.handler)
                  registry.del(entry)
                }
              }
            }
  
      , once = function (rm, element, type, fn, originalFn) {
          // wrap the handler in a handler that does a remove as well
          return function () {
            fn.apply(this, arguments)
            rm(element, type, originalFn)
          }
        }
  
      , removeListener = function (element, orgType, handler, namespaces) {
          var type     = orgType && orgType.replace(nameRegex, '')
            , handlers = registry.get(element, type, null, false)
            , removed  = {}
            , i, l
  
          for (i = 0, l = handlers.length; i < l; i++) {
            if ((!handler || handlers[i].original === handler) && handlers[i].inNamespaces(namespaces)) {
              // TODO: this is problematic, we have a registry.get() and registry.del() that
              // both do registry searches so we waste cycles doing this. Needs to be rolled into
              // a single registry.forAll(fn) that removes while finding, but the catch is that
              // we'll be splicing the arrays that we're iterating over. Needs extra tests to
              // make sure we don't screw it up. @rvagg
              registry.del(handlers[i])
              if (!removed[handlers[i].eventType] && handlers[i][eventSupport])
                removed[handlers[i].eventType] = { t: handlers[i].eventType, c: handlers[i].type }
            }
          }
          // check each type/element for removed listeners and remove the rootListener where it's no longer needed
          for (i in removed) {
            if (!registry.has(element, removed[i].t, null, false)) {
              // last listener of this type, remove the rootListener
              listener(element, removed[i].t, false, removed[i].c)
            }
          }
        }
  
        // set up a delegate helper using the given selector, wrap the handler function
      , delegate = function (selector, fn) {
          //TODO: findTarget (therefore $) is called twice, once for match and once for
          // setting e.currentTarget, fix this so it's only needed once
          var findTarget = function (target, root) {
                var i, array = isString(selector) ? selectorEngine(selector, root) : selector
                for (; target && target !== root; target = target.parentNode) {
                  for (i = array.length; i--;) {
                    if (array[i] === target) return target
                  }
                }
              }
            , handler = function (e) {
                var match = findTarget(e.target, this)
                if (match) fn.apply(match, arguments)
              }
  
          // __beanDel isn't pleasant but it's a private function, not exposed outside of Bean
          handler.__beanDel = {
              ft       : findTarget // attach it here for customEvents to use too
            , selector : selector
          }
          return handler
        }
  
      , fireListener = W3C_MODEL ? function (isNative, type, element) {
          // modern browsers, do a proper dispatchEvent()
          var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
          evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
          element.dispatchEvent(evt)
        } : function (isNative, type, element) {
          // old browser use onpropertychange, just increment a custom property to trigger the event
          element = targetElement(element, isNative)
          isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
        }
  
        /**
          * Public API: off(), on(), add(), (remove()), one(), fire(), clone()
          */
  
        /**
          * off(element[, eventType(s)[, handler ]])
          */
      , off = function (element, typeSpec, fn) {
          var isTypeStr = isString(typeSpec)
            , k, type, namespaces, i
  
          if (isTypeStr && typeSpec.indexOf(' ') > 0) {
            // off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')
            typeSpec = str2arr(typeSpec)
            for (i = typeSpec.length; i--;)
              off(element, typeSpec[i], fn)
            return element
          }
  
          type = isTypeStr && typeSpec.replace(nameRegex, '')
          if (type && customEvents[type]) type = customEvents[type].type
  
          if (!typeSpec || isTypeStr) {
            // off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
            if (namespaces = isTypeStr && typeSpec.replace(namespaceRegex, '')) namespaces = str2arr(namespaces, '.')
            removeListener(element, type, fn, namespaces)
          } else if (isFunction(typeSpec)) {
            // off(el, fn)
            removeListener(element, null, typeSpec)
          } else {
            // off(el, { t1: fn1, t2, fn2 })
            for (k in typeSpec) {
              if (typeSpec.hasOwnProperty(k)) off(element, k, typeSpec[k])
            }
          }
  
          return element
        }
  
        /**
          * on(element, eventType(s)[, selector], handler[, args ])
          */
      , on = function(element, events, selector, fn) {
          var originalFn, type, types, i, args, entry, first
  
          //TODO: the undefined check means you can't pass an 'args' argument, fix this perhaps?
          if (selector === undefined && typeof events == 'object') {
            //TODO: this can't handle delegated events
            for (type in events) {
              if (events.hasOwnProperty(type)) {
                on.call(this, element, type, events[type])
              }
            }
            return
          }
  
          if (!isFunction(selector)) {
            // delegated event
            originalFn = fn
            args       = slice.call(arguments, 4)
            fn         = delegate(selector, originalFn, selectorEngine)
          } else {
            args       = slice.call(arguments, 3)
            fn         = originalFn = selector
          }
  
          types = str2arr(events)
  
          // special case for one(), wrap in a self-removing handler
          if (this === ONE) {
            fn = once(off, element, events, fn, originalFn)
          }
  
          for (i = types.length; i--;) {
            // add new handler to the registry and check if it's the first for this element/type
            first = registry.put(entry = new RegEntry(
                element
              , types[i].replace(nameRegex, '') // event type
              , fn
              , originalFn
              , str2arr(types[i].replace(namespaceRegex, ''), '.') // namespaces
              , args
              , false // not root
            ))
            if (entry[eventSupport] && first) {
              // first event of this type on this element, add root listener
              listener(element, entry.eventType, true, entry.customType)
            }
          }
  
          return element
        }
  
        /**
          * add(element[, selector], eventType(s), handler[, args ])
          *
          * Deprecated: kept (for now) for backward-compatibility
          */
      , add = function (element, events, fn, delfn) {
          return on.apply(
              null
            , !isString(fn)
                ? slice.call(arguments)
                : [ element, fn, events, delfn ].concat(arguments.length > 3 ? slice.call(arguments, 5) : [])
          )
        }
  
        /**
          * one(element, eventType(s)[, selector], handler[, args ])
          */
      , one = function () {
          return on.apply(ONE, arguments)
        }
  
        /**
          * fire(element, eventType(s)[, args ])
          *
          * The optional 'args' argument must be an array, if no 'args' argument is provided
          * then we can use the browser's DOM event system, otherwise we trigger handlers manually
          */
      , fire = function (element, type, args) {
          var types = str2arr(type)
            , i, j, l, names, handlers
  
          for (i = types.length; i--;) {
            type = types[i].replace(nameRegex, '')
            if (names = types[i].replace(namespaceRegex, '')) names = str2arr(names, '.')
            if (!names && !args && element[eventSupport]) {
              fireListener(nativeEvents[type], type, element)
            } else {
              // non-native event, either because of a namespace, arguments or a non DOM element
              // iterate over all listeners and manually 'fire'
              handlers = registry.get(element, type, null, false)
              args = [false].concat(args)
              for (j = 0, l = handlers.length; j < l; j++) {
                if (handlers[j].inNamespaces(names)) {
                  handlers[j].handler.apply(element, args)
                }
              }
            }
          }
          return element
        }
  
        /**
          * clone(dstElement, srcElement[, eventType ])
          *
          * TODO: perhaps for consistency we should allow the same flexibility in type specifiers?
          */
      , clone = function (element, from, type) {
          var handlers = registry.get(from, type, null, false)
            , l = handlers.length
            , i = 0
            , args, beanDel
  
          for (; i < l; i++) {
            if (handlers[i].original) {
              args = [ element, handlers[i].type ]
              if (beanDel = handlers[i].handler.__beanDel) args.push(beanDel.selector)
              args.push(handlers[i].original)
              on.apply(null, args)
            }
          }
          return element
        }
  
      , bean = {
            on                : on
          , add               : add
          , one               : one
          , off               : off
          , remove            : off
          , clone             : clone
          , fire              : fire
          , setSelectorEngine : setSelectorEngine
          , noConflict        : function () {
              context[name] = old
              return this
            }
        }
  
    // for IE, clean up on unload to avoid leaks
    if (win.attachEvent) {
      var cleanup = function () {
        var i, entries = registry.entries()
        for (i in entries) {
          if (entries[i].type && entries[i].type !== 'unload') off(entries[i].element, entries[i].type)
        }
        win.detachEvent('onunload', cleanup)
        win.CollectGarbage && win.CollectGarbage()
      }
      win.attachEvent('onunload', cleanup)
    }
  
    // initialize selector engine to internal default (qSA or throw Error)
    setSelectorEngine()
  
    return bean
  }));
  

  provide("bean", module.exports);

  !function ($) {
    var b = require('bean')
  
      , integrate = function (method, type, method2) {
          var _args = type ? [type] : []
          return function () {
            for (var i = 0, l = this.length; i < l; i++) {
              if (!arguments.length && method == 'on' && type) method = 'fire'
              b[method].apply(this, [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0)))
            }
            return this
          }
        }
  
      , add   = integrate('add')
      , on    = integrate('on')
      , one   = integrate('one')
      , off   = integrate('off')
      , fire  = integrate('fire')
      , clone = integrate('clone')
  
      , hover = function (enter, leave, i) { // i for internal
          for (i = this.length; i--;) {
            b.on.call(this, this[i], 'mouseenter', enter)
            b.on.call(this, this[i], 'mouseleave', leave)
          }
          return this
        }
  
      , methods = {
            on             : on
          , addListener    : on
          , bind           : on
          , listen         : on
          , delegate       : add // jQuery compat, same arg order as add()
  
          , one            : one
  
          , off            : off
          , unbind         : off
          , unlisten       : off
          , removeListener : off
          , undelegate     : off
  
          , emit           : fire
          , trigger        : fire
  
          , cloneEvents    : clone
  
          , hover          : hover
        }
  
      , shortcuts =
           ('blur change click dblclick error focus focusin focusout keydown keypress '
          + 'keyup load mousedown mouseenter mouseleave mouseout mouseover mouseup '
          + 'mousemove resize scroll select submit unload').split(' ')
  
    for (var i = shortcuts.length; i--;) {
      methods[shortcuts[i]] = integrate('on', shortcuts[i])
    }
  
    b.setSelectorEngine($)
  
    $.ender(methods, true)
  }(ender);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  //     Underscore.js 1.4.2
  //     http://underscorejs.org
  //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  //     Underscore may be freely distributed under the MIT license.
  
  (function() {
  
    // Baseline setup
    // --------------
  
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
  
    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;
  
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};
  
    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
  
    // Create quick reference variables for speed access to core prototypes.
    var push             = ArrayProto.push,
        slice            = ArrayProto.slice,
        concat           = ArrayProto.concat,
        unshift          = ArrayProto.unshift,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;
  
    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeForEach      = ArrayProto.forEach,
      nativeMap          = ArrayProto.map,
      nativeReduce       = ArrayProto.reduce,
      nativeReduceRight  = ArrayProto.reduceRight,
      nativeFilter       = ArrayProto.filter,
      nativeEvery        = ArrayProto.every,
      nativeSome         = ArrayProto.some,
      nativeIndexOf      = ArrayProto.indexOf,
      nativeLastIndexOf  = ArrayProto.lastIndexOf,
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind;
  
    // Create a safe reference to the Underscore object for use below.
    var _ = function(obj) {
      if (obj instanceof _) return obj;
      if (!(this instanceof _)) return new _(obj);
      this._wrapped = obj;
    };
  
    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode.
    if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = _;
      }
      exports._ = _;
    } else {
      root['_'] = _;
    }
  
    // Current version.
    _.VERSION = '1.4.2';
  
    // Collection Functions
    // --------------------
  
    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function(obj, iterator, context) {
      if (obj == null) return;
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
      } else {
        for (var key in obj) {
          if (_.has(obj, key)) {
            if (iterator.call(context, obj[key], key, obj) === breaker) return;
          }
        }
      }
    };
  
    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = _.collect = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
      each(obj, function(value, index, list) {
        results[results.length] = iterator.call(context, value, index, list);
      });
      return results;
    };
  
    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
      var initial = arguments.length > 2;
      if (obj == null) obj = [];
      if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) iterator = _.bind(iterator, context);
        return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
      }
      each(obj, function(value, index, list) {
        if (!initial) {
          memo = value;
          initial = true;
        } else {
          memo = iterator.call(context, memo, value, index, list);
        }
      });
      if (!initial) throw new TypeError('Reduce of empty array with no initial value');
      return memo;
    };
  
    // The right-associative version of reduce, also known as `foldr`.
    // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
    _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
      var initial = arguments.length > 2;
      if (obj == null) obj = [];
      if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
        if (context) iterator = _.bind(iterator, context);
        return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
      }
      var length = obj.length;
      if (length !== +length) {
        var keys = _.keys(obj);
        length = keys.length;
      }
      each(obj, function(value, index, list) {
        index = keys ? keys[--length] : --length;
        if (!initial) {
          memo = obj[index];
          initial = true;
        } else {
          memo = iterator.call(context, memo, obj[index], index, list);
        }
      });
      if (!initial) throw new TypeError('Reduce of empty array with no initial value');
      return memo;
    };
  
    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, iterator, context) {
      var result;
      any(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value;
          return true;
        }
      });
      return result;
    };
  
    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
      each(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Return all the elements for which a truth test fails.
    _.reject = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      each(obj, function(value, index, list) {
        if (!iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Determine whether all of the elements match a truth test.
    // Delegates to **ECMAScript 5**'s native `every` if available.
    // Aliased as `all`.
    _.every = _.all = function(obj, iterator, context) {
      iterator || (iterator = _.identity);
      var result = true;
      if (obj == null) return result;
      if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
      each(obj, function(value, index, list) {
        if (!(result = result && iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function(obj, iterator, context) {
      iterator || (iterator = _.identity);
      var result = false;
      if (obj == null) return result;
      if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
      each(obj, function(value, index, list) {
        if (result || (result = iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `include`.
    _.contains = _.include = function(obj, target) {
      var found = false;
      if (obj == null) return found;
      if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
      found = any(obj, function(value) {
        return value === target;
      });
      return found;
    };
  
    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      return _.map(obj, function(value) {
        return (_.isFunction(method) ? method : value[method]).apply(value, args);
      });
    };
  
    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function(obj, key) {
      return _.map(obj, function(value){ return value[key]; });
    };
  
    // Convenience version of a common use case of `filter`: selecting only objects
    // with specific `key:value` pairs.
    _.where = function(obj, attrs) {
      if (_.isEmpty(attrs)) return [];
      return _.filter(obj, function(value) {
        for (var key in attrs) {
          if (attrs[key] !== value[key]) return false;
        }
        return true;
      });
    };
  
    // Return the maximum element or (element-based computation).
    // Can't optimize arrays of integers longer than 65,535 elements.
    // See: https://bugs.webkit.org/show_bug.cgi?id=80797
    _.max = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
        return Math.max.apply(Math, obj);
      }
      if (!iterator && _.isEmpty(obj)) return -Infinity;
      var result = {computed : -Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed >= result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Return the minimum element (or element-based computation).
    _.min = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
        return Math.min.apply(Math, obj);
      }
      if (!iterator && _.isEmpty(obj)) return Infinity;
      var result = {computed : Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed < result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Shuffle an array.
    _.shuffle = function(obj) {
      var rand;
      var index = 0;
      var shuffled = [];
      each(obj, function(value) {
        rand = _.random(index++);
        shuffled[index - 1] = shuffled[rand];
        shuffled[rand] = value;
      });
      return shuffled;
    };
  
    // An internal function to generate lookup iterators.
    var lookupIterator = function(value) {
      return _.isFunction(value) ? value : function(obj){ return obj[value]; };
    };
  
    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function(obj, value, context) {
      var iterator = lookupIterator(value);
      return _.pluck(_.map(obj, function(value, index, list) {
        return {
          value : value,
          index : index,
          criteria : iterator.call(context, value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index < right.index ? -1 : 1;
      }), 'value');
    };
  
    // An internal function used for aggregate "group by" operations.
    var group = function(obj, value, context, behavior) {
      var result = {};
      var iterator = lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  
    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = function(obj, value, context) {
      return group(obj, value, context, function(result, key, value) {
        (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
      });
    };
  
    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = function(obj, value, context) {
      return group(obj, value, context, function(result, key, value) {
        if (!_.has(result, key)) result[key] = 0;
        result[key]++;
      });
    };
  
    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function(array, obj, iterator, context) {
      iterator = iterator == null ? _.identity : lookupIterator(iterator);
      var value = iterator.call(context, obj);
      var low = 0, high = array.length;
      while (low < high) {
        var mid = (low + high) >>> 1;
        iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
      }
      return low;
    };
  
    // Safely convert anything iterable into a real, live array.
    _.toArray = function(obj) {
      if (!obj) return [];
      if (obj.length === +obj.length) return slice.call(obj);
      return _.values(obj);
    };
  
    // Return the number of elements in an object.
    _.size = function(obj) {
      return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
    };
  
    // Array Functions
    // ---------------
  
    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    _.first = _.head = _.take = function(array, n, guard) {
      return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
    };
  
    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N. The **guard** check allows it to work with
    // `_.map`.
    _.initial = function(array, n, guard) {
      return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
    };
  
    // Get the last element of an array. Passing **n** will return the last N
    // values in the array. The **guard** check allows it to work with `_.map`.
    _.last = function(array, n, guard) {
      if ((n != null) && !guard) {
        return slice.call(array, Math.max(array.length - n, 0));
      } else {
        return array[array.length - 1];
      }
    };
  
    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array. The **guard**
    // check allows it to work with `_.map`.
    _.rest = _.tail = _.drop = function(array, n, guard) {
      return slice.call(array, (n == null) || guard ? 1 : n);
    };
  
    // Trim out all falsy values from an array.
    _.compact = function(array) {
      return _.filter(array, function(value){ return !!value; });
    };
  
    // Internal implementation of a recursive `flatten` function.
    var flatten = function(input, shallow, output) {
      each(input, function(value) {
        if (_.isArray(value)) {
          shallow ? push.apply(output, value) : flatten(value, shallow, output);
        } else {
          output.push(value);
        }
      });
      return output;
    };
  
    // Return a completely flattened version of an array.
    _.flatten = function(array, shallow) {
      return flatten(array, shallow, []);
    };
  
    // Return a version of the array that does not contain the specified value(s).
    _.without = function(array) {
      return _.difference(array, slice.call(arguments, 1));
    };
  
    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function(array, isSorted, iterator, context) {
      var initial = iterator ? _.map(array, iterator, context) : array;
      var results = [];
      var seen = [];
      each(initial, function(value, index) {
        if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
          seen.push(value);
          results.push(array[index]);
        }
      });
      return results;
    };
  
    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function() {
      return _.uniq(concat.apply(ArrayProto, arguments));
    };
  
    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    _.intersection = function(array) {
      var rest = slice.call(arguments, 1);
      return _.filter(_.uniq(array), function(item) {
        return _.every(rest, function(other) {
          return _.indexOf(other, item) >= 0;
        });
      });
    };
  
    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    _.difference = function(array) {
      var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
      return _.filter(array, function(value){ return !_.contains(rest, value); });
    };
  
    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function() {
      var args = slice.call(arguments);
      var length = _.max(_.pluck(args, 'length'));
      var results = new Array(length);
      for (var i = 0; i < length; i++) {
        results[i] = _.pluck(args, "" + i);
      }
      return results;
    };
  
    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    _.object = function(list, values) {
      var result = {};
      for (var i = 0, l = list.length; i < l; i++) {
        if (values) {
          result[list[i]] = values[i];
        } else {
          result[list[i][0]] = list[i][1];
        }
      }
      return result;
    };
  
    // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
    // we need this function. Return the position of the first occurrence of an
    // item in an array, or -1 if the item is not included in the array.
    // Delegates to **ECMAScript 5**'s native `indexOf` if available.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function(array, item, isSorted) {
      if (array == null) return -1;
      var i = 0, l = array.length;
      if (isSorted) {
        if (typeof isSorted == 'number') {
          i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
        } else {
          i = _.sortedIndex(array, item);
          return array[i] === item ? i : -1;
        }
      }
      if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
      for (; i < l; i++) if (array[i] === item) return i;
      return -1;
    };
  
    // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
    _.lastIndexOf = function(array, item, from) {
      if (array == null) return -1;
      var hasIndex = from != null;
      if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
        return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
      }
      var i = (hasIndex ? from : array.length);
      while (i--) if (array[i] === item) return i;
      return -1;
    };
  
    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function(start, stop, step) {
      if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
      }
      step = arguments[2] || 1;
  
      var len = Math.max(Math.ceil((stop - start) / step), 0);
      var idx = 0;
      var range = new Array(len);
  
      while(idx < len) {
        range[idx++] = start;
        start += step;
      }
  
      return range;
    };
  
    // Function (ahem) Functions
    // ------------------
  
    // Reusable constructor function for prototype setting.
    var ctor = function(){};
  
    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Binding with arguments is also known as `curry`.
    // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
    // We check for `func.bind` first, to fail fast when `func` is undefined.
    _.bind = function bind(func, context) {
      var bound, args;
      if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
      if (!_.isFunction(func)) throw new TypeError;
      args = slice.call(arguments, 2);
      return bound = function() {
        if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
        ctor.prototype = func.prototype;
        var self = new ctor;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) return result;
        return self;
      };
    };
  
    // Bind all of an object's methods to that object. Useful for ensuring that
    // all callbacks defined on an object belong to it.
    _.bindAll = function(obj) {
      var funcs = slice.call(arguments, 1);
      if (funcs.length == 0) funcs = _.functions(obj);
      each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
      return obj;
    };
  
    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
      var memo = {};
      hasher || (hasher = _.identity);
      return function() {
        var key = hasher.apply(this, arguments);
        return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
      };
    };
  
    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function(){ return func.apply(null, args); }, wait);
    };
  
    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function(func) {
      return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };
  
    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time.
    _.throttle = function(func, wait) {
      var context, args, timeout, throttling, more, result;
      var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
      return function() {
        context = this; args = arguments;
        var later = function() {
          timeout = null;
          if (more) {
            result = func.apply(context, args);
          }
          whenDone();
        };
        if (!timeout) timeout = setTimeout(later, wait);
        if (throttling) {
          more = true;
        } else {
          throttling = true;
          result = func.apply(context, args);
        }
        whenDone();
        return result;
      };
    };
  
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
      var timeout, result;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(context, args);
        return result;
      };
    };
  
    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = function(func) {
      var ran = false, memo;
      return function() {
        if (ran) return memo;
        ran = true;
        memo = func.apply(this, arguments);
        func = null;
        return memo;
      };
    };
  
    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
      return function() {
        var args = [func];
        push.apply(args, arguments);
        return wrapper.apply(this, args);
      };
    };
  
    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
      var funcs = arguments;
      return function() {
        var args = arguments;
        for (var i = funcs.length - 1; i >= 0; i--) {
          args = [funcs[i].apply(this, args)];
        }
        return args[0];
      };
    };
  
    // Returns a function that will only be executed after being called N times.
    _.after = function(times, func) {
      if (times <= 0) return func();
      return function() {
        if (--times < 1) {
          return func.apply(this, arguments);
        }
      };
    };
  
    // Object Functions
    // ----------------
  
    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = nativeKeys || function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
      return keys;
    };
  
    // Retrieve the values of an object's properties.
    _.values = function(obj) {
      var values = [];
      for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
      return values;
    };
  
    // Convert an object into a list of `[key, value]` pairs.
    _.pairs = function(obj) {
      var pairs = [];
      for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
      return pairs;
    };
  
    // Invert the keys and values of an object. The values must be serializable.
    _.invert = function(obj) {
      var result = {};
      for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
      return result;
    };
  
    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function(obj) {
      var names = [];
      for (var key in obj) {
        if (_.isFunction(obj[key])) names.push(key);
      }
      return names.sort();
    };
  
    // Extend a given object with all the properties in passed-in object(s).
    _.extend = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function(obj) {
      var copy = {};
      var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
      each(keys, function(key) {
        if (key in obj) copy[key] = obj[key];
      });
      return copy;
    };
  
     // Return a copy of the object without the blacklisted properties.
    _.omit = function(obj) {
      var copy = {};
      var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
      for (var key in obj) {
        if (!_.contains(keys, key)) copy[key] = obj[key];
      }
      return copy;
    };
  
    // Fill in a given object with default properties.
    _.defaults = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
      if (!_.isObject(obj)) return obj;
      return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };
  
    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };
  
    // Internal recursive comparison function for `isEqual`.
    var eq = function(a, b, aStack, bStack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
      if (a === b) return a !== 0 || 1 / a == 1 / b;
      // A strict comparison is necessary because `null == undefined`.
      if (a == null || b == null) return a === b;
      // Unwrap any wrapped objects.
      if (a instanceof _) a = a._wrapped;
      if (b instanceof _) b = b._wrapped;
      // Compare `[[Class]]` names.
      var className = toString.call(a);
      if (className != toString.call(b)) return false;
      switch (className) {
        // Strings, numbers, dates, and booleans are compared by value.
        case '[object String]':
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return a == String(b);
        case '[object Number]':
          // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
          // other numeric values.
          return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a == +b;
        // RegExps are compared by their source patterns and flags.
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') return false;
      // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
      var length = aStack.length;
      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] == a) return bStack[length] == b;
      }
      // Add the first object to the stack of traversed objects.
      aStack.push(a);
      bStack.push(b);
      var size = 0, result = true;
      // Recursively compare objects and arrays.
      if (className == '[object Array]') {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = a.length;
        result = size == b.length;
        if (result) {
          // Deep compare the contents, ignoring non-numeric properties.
          while (size--) {
            if (!(result = eq(a[size], b[size], aStack, bStack))) break;
          }
        }
      } else {
        // Objects with different constructors are not equivalent, but `Object`s
        // from different frames are.
        var aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                                 _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
          return false;
        }
        // Deep compare objects.
        for (var key in a) {
          if (_.has(a, key)) {
            // Count the expected number of properties.
            size++;
            // Deep compare each member.
            if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
          }
        }
        // Ensure that both objects contain the same number of properties.
        if (result) {
          for (key in b) {
            if (_.has(b, key) && !(size--)) break;
          }
          result = !size;
        }
      }
      // Remove the first object from the stack of traversed objects.
      aStack.pop();
      bStack.pop();
      return result;
    };
  
    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
      return eq(a, b, [], []);
    };
  
    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
      if (obj == null) return true;
      if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
      for (var key in obj) if (_.has(obj, key)) return false;
      return true;
    };
  
    // Is a given value a DOM element?
    _.isElement = function(obj) {
      return !!(obj && obj.nodeType === 1);
    };
  
    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
      return toString.call(obj) == '[object Array]';
    };
  
    // Is a given variable an object?
    _.isObject = function(obj) {
      return obj === Object(obj);
    };
  
    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
    each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
      _['is' + name] = function(obj) {
        return toString.call(obj) == '[object ' + name + ']';
      };
    });
  
    // Define a fallback version of the method in browsers (ahem, IE), where
    // there isn't any inspectable "Arguments" type.
    if (!_.isArguments(arguments)) {
      _.isArguments = function(obj) {
        return !!(obj && _.has(obj, 'callee'));
      };
    }
  
    // Optimize `isFunction` if appropriate.
    if (typeof (/./) !== 'function') {
      _.isFunction = function(obj) {
        return typeof obj === 'function';
      };
    }
  
    // Is a given object a finite number?
    _.isFinite = function(obj) {
      return _.isNumber(obj) && isFinite(obj);
    };
  
    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    _.isNaN = function(obj) {
      return _.isNumber(obj) && obj != +obj;
    };
  
    // Is a given value a boolean?
    _.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    };
  
    // Is a given value equal to null?
    _.isNull = function(obj) {
      return obj === null;
    };
  
    // Is a given variable undefined?
    _.isUndefined = function(obj) {
      return obj === void 0;
    };
  
    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    _.has = function(obj, key) {
      return hasOwnProperty.call(obj, key);
    };
  
    // Utility Functions
    // -----------------
  
    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function() {
      root._ = previousUnderscore;
      return this;
    };
  
    // Keep the identity function around for default iterators.
    _.identity = function(value) {
      return value;
    };
  
    // Run a function **n** times.
    _.times = function(n, iterator, context) {
      for (var i = 0; i < n; i++) iterator.call(context, i);
    };
  
    // Return a random integer between min and max (inclusive).
    _.random = function(min, max) {
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + (0 | Math.random() * (max - min + 1));
    };
  
    // List of HTML entities for escaping.
    var entityMap = {
      escape: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
      }
    };
    entityMap.unescape = _.invert(entityMap.escape);
  
    // Regexes containing the keys and values listed immediately above.
    var entityRegexes = {
      escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
      unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
    };
  
    // Functions for escaping and unescaping strings to/from HTML interpolation.
    _.each(['escape', 'unescape'], function(method) {
      _[method] = function(string) {
        if (string == null) return '';
        return ('' + string).replace(entityRegexes[method], function(match) {
          return entityMap[method][match];
        });
      };
    });
  
    // If the value of the named property is a function then invoke it;
    // otherwise, return it.
    _.result = function(object, property) {
      if (object == null) return null;
      var value = object[property];
      return _.isFunction(value) ? value.call(object) : value;
    };
  
    // Add your own custom functions to the Underscore object.
    _.mixin = function(obj) {
      each(_.functions(obj), function(name){
        var func = _[name] = obj[name];
        _.prototype[name] = function() {
          var args = [this._wrapped];
          push.apply(args, arguments);
          return result.call(this, func.apply(_, args));
        };
      });
    };
  
    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
      var id = idCounter++;
      return prefix ? prefix + id : id;
    };
  
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
      evaluate    : /<%([\s\S]+?)%>/g,
      interpolate : /<%=([\s\S]+?)%>/g,
      escape      : /<%-([\s\S]+?)%>/g
    };
  
    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;
  
    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
      "'":      "'",
      '\\':     '\\',
      '\r':     'r',
      '\n':     'n',
      '\t':     't',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };
  
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  
    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function(text, data, settings) {
      settings = _.defaults({}, settings, _.templateSettings);
  
      // Combine delimiters into one regular expression via alternation.
      var matcher = new RegExp([
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
      ].join('|') + '|$', 'g');
  
      // Compile the template source, escaping string literals appropriately.
      var index = 0;
      var source = "__p+='";
      text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset)
          .replace(escaper, function(match) { return '\\' + escapes[match]; });
        source +=
          escape ? "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" :
          interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" :
          evaluate ? "';\n" + evaluate + "\n__p+='" : '';
        index = offset + match.length;
      });
      source += "';\n";
  
      // If a variable is not specified, place data values in local scope.
      if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
  
      source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + "return __p;\n";
  
      try {
        var render = new Function(settings.variable || 'obj', '_', source);
      } catch (e) {
        e.source = source;
        throw e;
      }
  
      if (data) return render(data, _);
      var template = function(data) {
        return render.call(this, data, _);
      };
  
      // Provide the compiled function source as a convenience for precompilation.
      template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';
  
      return template;
    };
  
    // Add a "chain" function, which will delegate to the wrapper.
    _.chain = function(obj) {
      return _(obj).chain();
    };
  
    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.
  
    // Helper function to continue chaining intermediate results.
    var result = function(obj) {
      return this._chain ? _(obj).chain() : obj;
    };
  
    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);
  
    // Add all mutator Array functions to the wrapper.
    each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        var obj = this._wrapped;
        method.apply(obj, arguments);
        if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
        return result.call(this, obj);
      };
    });
  
    // Add all accessor Array functions to the wrapper.
    each(['concat', 'join', 'slice'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        return result.call(this, method.apply(this._wrapped, arguments));
      };
    });
  
    _.extend(_.prototype, {
  
      // Start chaining a wrapped Underscore object.
      chain: function() {
        this._chain = true;
        return this;
      },
  
      // Extracts the result from a wrapped and chained object.
      value: function() {
        return this._wrapped;
      }
  
    });
  
  }).call(this);
  

  provide("underscore", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * @preserve Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz & Jacob Thornton 2012
    * MIT License
    */
  
  (function (name, definition, context) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof context['define'] == 'function' && context['define']['amd']) define(name, definition)
    else context[name] = definition()
  })('qwery', function () {
    var doc = document
      , html = doc.documentElement
      , byClass = 'getElementsByClassName'
      , byTag = 'getElementsByTagName'
      , qSA = 'querySelectorAll'
      , useNativeQSA = 'useNativeQSA'
      , tagName = 'tagName'
      , nodeType = 'nodeType'
      , select // main select() method, assign later
  
      , id = /#([\w\-]+)/
      , clas = /\.[\w\-]+/g
      , idOnly = /^#([\w\-]+)$/
      , classOnly = /^\.([\w\-]+)$/
      , tagOnly = /^([\w\-]+)$/
      , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
      , splittable = /(^|,)\s*[>~+]/
      , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
      , splitters = /[\s\>\+\~]/
      , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
      , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
      , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
      , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
      , pseudo = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/
      , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
      , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
      , tokenizr = new RegExp(splitters.source + splittersMore.source)
      , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')
      , walker = {
          ' ': function (node) {
            return node && node !== html && node.parentNode
          }
        , '>': function (node, contestant) {
            return node && node.parentNode == contestant.parentNode && node.parentNode
          }
        , '~': function (node) {
            return node && node.previousSibling
          }
        , '+': function (node, contestant, p1, p2) {
            if (!node) return false
            return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
          }
        }
  
    function cache() {
      this.c = {}
    }
    cache.prototype = {
      g: function (k) {
        return this.c[k] || undefined
      }
    , s: function (k, v, r) {
        v = r ? new RegExp(v) : v
        return (this.c[k] = v)
      }
    }
  
    var classCache = new cache()
      , cleanCache = new cache()
      , attrCache = new cache()
      , tokenCache = new cache()
  
    function classRegex(c) {
      return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
    }
  
    // not quite as fast as inline loops in older browsers so don't use liberally
    function each(a, fn) {
      var i = 0, l = a.length
      for (; i < l; i++) fn(a[i])
    }
  
    function flatten(ar) {
      for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
      return r
    }
  
    function arrayify(ar) {
      var i = 0, l = ar.length, r = []
      for (; i < l; i++) r[i] = ar[i]
      return r
    }
  
    function previous(n) {
      while (n = n.previousSibling) if (n[nodeType] == 1) break;
      return n
    }
  
    function q(query) {
      return query.match(chunker)
    }
  
    // called using `this` as element and arguments from regex group results.
    // given => div.hello[title="world"]:foo('bar')
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var i, m, k, o, classes
      if (this[nodeType] !== 1) return false
      if (tag && tag !== '*' && this[tagName] && this[tagName].toLowerCase() !== tag) return false
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) if (!classRegex(classes[i].slice(1)).test(this.className)) return false
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) return false
      if (wholeAttribute && !value) { // select is just for existance of attrib
        o = this.attributes
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
        // select is for attrib equality
        return false
      }
      return this
    }
  
    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
    }
  
    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
      }
      return 0
    }
  
    // given a selector, first check for simple cases then collect all base candidate matches and filter
    function _qwery(selector, _root) {
      var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
        , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        , dividedTokens = selector.match(dividers)
  
      if (!tokens.length) return r
  
      token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
      if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
      if (!root) return r
  
      intr = q(token)
      // collect base candidates to filter
      els = root !== _root && root[nodeType] !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
        function (r) {
          while (root = root.nextSibling) {
            root[nodeType] == 1 && (intr[1] ? intr[1] == root[tagName].toLowerCase() : 1) && (r[r.length] = root)
          }
          return r
        }([]) :
        root[byTag](intr[1] || '*')
      // filter elements according to the right-most part of the selector
      for (i = 0, l = els.length; i < l; i++) {
        if (item = interpret.apply(els[i], intr)) r[r.length] = item
      }
      if (!tokens.length) return r
  
      // filter further according to the rest of the selector (the left side)
      each(r, function(e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
      return ret
    }
  
    // compare element to a selector
    function is(el, selector, root) {
      if (isNode(selector)) return el == selector
      if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?
  
      var selectors = selector.split(','), tokens, dividedTokens
      while (selector = selectors.pop()) {
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        dividedTokens = selector.match(dividers)
        tokens = tokens.slice(0) // copy array
        if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
          return true
        }
      }
      return false
    }
  
    // given elements matching the right-most part of a selector, filter out any that don't match the rest
    function ancestorMatch(el, tokens, dividedTokens, root) {
      var cand
      // recursively work backwards through the tokens and up the dom, covering all options
      function crawl(e, i, p) {
        while (p = walker[dividedTokens[i]](p, e)) {
          if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
            if (i) {
              if (cand = crawl(p, i - 1, p)) return cand
            } else return p
          }
        }
      }
      return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
    }
  
    function isNode(el, t) {
      return el && typeof el === 'object' && (t = el[nodeType]) && (t == 1 || t == 9)
    }
  
    function uniq(ar) {
      var a = [], i, j
      o: for (i = 0; i < ar.length; ++i) {
        for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
        a[a.length] = ar[i]
      }
      return a
    }
  
    function arrayLike(o) {
      return (typeof o === 'object' && isFinite(o.length))
    }
  
    function normalizeRoot(root) {
      if (!root) return doc
      if (typeof root == 'string') return qwery(root)[0]
      if (!root[nodeType] && arrayLike(root)) return root[0]
      return root
    }
  
    function byId(root, id, el) {
      // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
      return root[nodeType] === 9 ? root.getElementById(id) :
        root.ownerDocument &&
          (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
            (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
    }
  
    function qwery(selector, _root) {
      var m, el, root = normalizeRoot(_root)
  
      // easy, fast cases that we can dispatch with simple DOM calls
      if (!root || !selector) return []
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
      }
      if (selector && arrayLike(selector)) return flatten(selector)
      if (m = selector.match(easy)) {
        if (m[1]) return (el = byId(root, m[1])) ? [el] : []
        if (m[2]) return arrayify(root[byTag](m[2]))
        if (hasByClass && m[3]) return arrayify(root[byClass](m[3]))
      }
  
      return select(selector, root)
    }
  
    // where the root is not document and a relationship selector is first we have to
    // do some awkward adjustments to get it to work, even with qSA
    function collectSelector(root, collector) {
      return function(s) {
        var oid, nid
        if (splittable.test(s)) {
          if (root[nodeType] !== 9) {
           // make sure the el has an id, rewrite the query, set root to doc and run it
           if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
           s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
           collector(root.parentNode || root, s, true)
           oid || root.removeAttribute('id')
          }
          return;
        }
        s.length && collector(root, s, false)
      }
    }
  
    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (element, container) {
        container = container[nodeType] === 9 || container == window ? html : container
        return container !== element && container.contains(element)
      } :
      function (element, container) {
        while (element = element.parentNode) if (element === container) return 1
        return 0
      }
    , getAttr = function() {
        // detect buggy IE src/href getAttribute() call
        var e = doc.createElement('p')
        return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
          function(e, a) {
            return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
              e.getAttribute(a, 2) : e.getAttribute(a)
          } :
          function(e, a) { return e.getAttribute(a) }
     }()
    , hasByClass = !!doc[byClass]
      // has native qSA support
    , hasQSA = doc.querySelector && doc[qSA]
      // use native qSA
    , selectQSA = function (selector, root) {
        var result = [], ss, e
        try {
          if (root[nodeType] === 9 || !splittable.test(selector)) {
            // most work is done right here, defer to qSA
            return arrayify(root[qSA](selector))
          }
          // special case where we need the services of `collectSelector()`
          each(ss = selector.split(','), collectSelector(root, function(ctx, s) {
            e = ctx[qSA](s)
            if (e.length == 1) result[result.length] = e.item(0)
            else if (e.length) result = result.concat(arrayify(e))
          }))
          return ss.length > 1 && result.length > 1 ? uniq(result) : result
        } catch(ex) { }
        return selectNonNative(selector, root)
      }
      // no native selector support
    , selectNonNative = function (selector, root) {
        var result = [], items, m, i, l, r, ss
        selector = selector.replace(normalizr, '$1')
        if (m = selector.match(tagAndOrClass)) {
          r = classRegex(m[2])
          items = root[byTag](m[1] || '*')
          for (i = 0, l = items.length; i < l; i++) {
            if (r.test(items[i].className)) result[result.length] = items[i]
          }
          return result
        }
        // more complex selector, get `_qwery()` to do the work for us
        each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
          r = _qwery(s, ctx)
          for (i = 0, l = r.length; i < l; i++) {
            if (ctx[nodeType] === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
          }
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      }
    , configure = function (options) {
        // configNativeQSA: use fully-internal selector or native qSA where present
        if (typeof options[useNativeQSA] !== 'undefined')
          select = !options[useNativeQSA] ? selectNonNative : hasQSA ? selectQSA : selectNonNative
      }
  
    configure({ useNativeQSA: true })
  
    qwery.configure = configure
    qwery.uniq = uniq
    qwery.is = is
    qwery.pseudos = {}
  
    return qwery
  }, this);
  

  provide("qwery", module.exports);

  (function ($) {
    var q = function () {
      var r
      try {
        r = require('qwery')
      } catch (ex) {
        r = require('qwery-mobile')
      } finally {
        return r
      }
    }()
  
    $.pseudos = q.pseudos
  
    $._select = function (s, r) {
      // detect if sibling module 'bonzo' is available at run-time
      // rather than load-time since technically it's not a dependency and
      // can be loaded in any order
      // hence the lazy function re-definition
      return ($._select = (function () {
        var b
        if (typeof $.create == 'function') return function (s, r) {
          return /^\s*</.test(s) ? $.create(s, r) : q(s, r)
        }
        try {
          b = require('bonzo')
          return function (s, r) {
            return /^\s*</.test(s) ? b.create(s, r) : q(s, r)
          }
        } catch (e) { }
        return q
      })())(s, r)
    }
  
    $.ender({
        find: function (s) {
          var r = [], i, l, j, k, els
          for (i = 0, l = this.length; i < l; i++) {
            els = q(s, this[i])
            for (j = 0, k = els.length; j < k; j++) r.push(els[j])
          }
          return $(q.uniq(r))
        }
      , and: function (s) {
          var plus = $(s)
          for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
            this[i] = plus[j]
          }
          this.length += plus.length
          return this
        }
      , is: function(s, r) {
          var i, l
          for (i = 0, l = this.length; i < l; i++) {
            if (q.is(this[i], s, r)) {
              return true
            }
          }
          return false
        }
    }, true)
  }(ender));
  

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bonzo: DOM Utility (c) Dustin Diaz 2012
    * https://github.com/ded/bonzo
    * License MIT
    */
  (function (name, definition, context) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof context['define'] == 'function' && context['define']['amd']) define(name, definition)
    else context[name] = definition()
  })('bonzo', function() {
    var win = window
      , doc = win.document
      , html = doc.documentElement
      , parentNode = 'parentNode'
      , query = null // used for setting a selector engine host
      , specialAttributes = /^(checked|value|selected|disabled)$/i
      , specialTags = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i // tags that we have trouble inserting *into*
      , table = ['<table>', '</table>', 1]
      , td = ['<table><tbody><tr>', '</tr></tbody></table>', 3]
      , option = ['<select>', '</select>', 1]
      , noscope = ['_', '', 0, 1]
      , tagMap = { // tags that we have trouble *inserting*
            thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
          , tr: ['<table><tbody>', '</tbody></table>', 2]
          , th: td , td: td
          , col: ['<table><colgroup>', '</colgroup></table>', 2]
          , fieldset: ['<form>', '</form>', 1]
          , legend: ['<form><fieldset>', '</fieldset></form>', 2]
          , option: option, optgroup: option
          , script: noscope, style: noscope, link: noscope, param: noscope, base: noscope
        }
      , stateAttributes = /^(checked|selected|disabled)$/
      , ie = /msie/i.test(navigator.userAgent)
      , hasClass, addClass, removeClass
      , uidMap = {}
      , uuids = 0
      , digit = /^-?[\d\.]+$/
      , dattr = /^data-(.+)$/
      , px = 'px'
      , setAttribute = 'setAttribute'
      , getAttribute = 'getAttribute'
      , byTag = 'getElementsByTagName'
      , features = function() {
          var e = doc.createElement('p')
          e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
          return {
            hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
          , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
          , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
          , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
          , transform: function () {
              var props = ['transform', 'webkitTransform', 'MozTransform', 'OTransform', 'msTransform'], i
              for (i = 0; i < props.length; i++) {
                if (props[i] in e.style) return props[i]
              }
            }()
          , classList: 'classList' in e
          , opasity: function () {
              return typeof doc.createElement('a').style.opacity !== 'undefined'
            }()
          }
        }()
      , trimReplace = /(^\s*|\s*$)/g
      , whitespaceRegex = /\s+/
      , toString = String.prototype.toString
      , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, boxFlex: 1, WebkitBoxFlex: 1, MozBoxFlex: 1 }
      , trim = String.prototype.trim ?
          function (s) {
            return s.trim()
          } :
          function (s) {
            return s.replace(trimReplace, '')
          }
  
  
    /**
     * @param {string} c a class name to test
     * @return {boolean}
     */
    function classReg(c) {
      return new RegExp("(^|\\s+)" + c + "(\\s+|$)")
    }
  
  
    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @param {boolean=} opt_rev
     * @return {Bonzo|Array}
     */
    function each(ar, fn, opt_scope, opt_rev) {
      var ind, i = 0, l = ar.length
      for (; i < l; i++) {
        ind = opt_rev ? ar.length - i - 1 : i
        fn.call(opt_scope || ar[ind], ar[ind], ind, ar)
      }
      return ar
    }
  
  
    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {Bonzo|Array}
     */
    function deepEach(ar, fn, opt_scope) {
      for (var i = 0, l = ar.length; i < l; i++) {
        if (isNode(ar[i])) {
          deepEach(ar[i].childNodes, fn, opt_scope)
          fn.call(opt_scope || ar[i], ar[i], i, ar)
        }
      }
      return ar
    }
  
  
    /**
     * @param {string} s
     * @return {string}
     */
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase()
      })
    }
  
  
    /**
     * @param {string} s
     * @return {string}
     */
    function decamelize(s) {
      return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
    }
  
  
    /**
     * @param {Element} el
     * @return {*}
     */
    function data(el) {
      el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
      var uid = el[getAttribute]('data-node-uid')
      return uidMap[uid] || (uidMap[uid] = {})
    }
  
  
    /**
     * removes the data associated with an element
     * @param {Element} el
     */
    function clearData(el) {
      var uid = el[getAttribute]('data-node-uid')
      if (uid) delete uidMap[uid]
    }
  
  
    function dataValue(d) {
      var f
      try {
        return (d === null || d === undefined) ? undefined :
          d === 'true' ? true :
            d === 'false' ? false :
              d === 'null' ? null :
                (f = parseFloat(d)) == d ? f : d;
      } catch(e) {}
      return undefined
    }
  
    function isNode(node) {
      return node && node.nodeName && (node.nodeType == 1 || node.nodeType == 11)
    }
  
  
    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {boolean} whether `some`thing was found
     */
    function some(ar, fn, opt_scope) {
      for (var i = 0, j = ar.length; i < j; ++i) if (fn.call(opt_scope || null, ar[i], i, ar)) return true
      return false
    }
  
  
    /**
     * this could be a giant enum of CSS properties
     * but in favor of file size sans-closure deadcode optimizations
     * we're just asking for any ol string
     * then it gets transformed into the appropriate style property for JS access
     * @param {string} p
     * @return {string}
     */
    function styleProperty(p) {
        (p == 'transform' && (p = features.transform)) ||
          (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + 'Origin')) ||
          (p == 'float' && (p = features.cssFloat))
        return p ? camelize(p) : null
    }
  
    var getStyle = features.computedStyle ?
      function (el, property) {
        var value = null
          , computed = doc.defaultView.getComputedStyle(el, '')
        computed && (value = computed[property])
        return el.style[property] || value
      } :
  
      (ie && html.currentStyle) ?
  
      /**
       * @param {Element} el
       * @param {string} property
       * @return {string|number}
       */
      function (el, property) {
        if (property == 'opacity' && !features.opasity) {
          var val = 100
          try {
            val = el['filters']['DXImageTransform.Microsoft.Alpha'].opacity
          } catch (e1) {
            try {
              val = el['filters']('alpha').opacity
            } catch (e2) {}
          }
          return val / 100
        }
        var value = el.currentStyle ? el.currentStyle[property] : null
        return el.style[property] || value
      } :
  
      function (el, property) {
        return el.style[property]
      }
  
    // this insert method is intense
    function insert(target, host, fn, rev) {
      var i = 0, self = host || this, r = []
        // target nodes could be a css selector if it's a string and a selector engine is present
        // otherwise, just use target
        , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
      // normalize each node in case it's still a string and we need to create nodes on the fly
      each(normalize(nodes), function (t, j) {
        each(self, function (el) {
          fn(t, r[i++] = j > 0 ? cloneNode(self, el) : el)
        }, null, rev)
      }, this, rev)
      self.length = i
      each(r, function (e) {
        self[--i] = e
      }, null, !rev)
      return self
    }
  
  
    /**
     * sets an element to an explicit x/y position on the page
     * @param {Element} el
     * @param {?number} x
     * @param {?number} y
     */
    function xy(el, x, y) {
      var $el = bonzo(el)
        , style = $el.css('position')
        , offset = $el.offset()
        , rel = 'relative'
        , isRel = style == rel
        , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]
  
      if (style == 'static') {
        $el.css('position', rel)
        style = rel
      }
  
      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)
  
      x != null && (el.style.left = x - offset.left + delta[0] + px)
      y != null && (el.style.top = y - offset.top + delta[1] + px)
  
    }
  
    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    if (features.classList) {
      hasClass = function (el, c) {
        return el.classList.contains(c)
      }
      addClass = function (el, c) {
        el.classList.add(c)
      }
      removeClass = function (el, c) {
        el.classList.remove(c)
      }
    }
    else {
      hasClass = function (el, c) {
        return classReg(c).test(el.className)
      }
      addClass = function (el, c) {
        el.className = trim(el.className + ' ' + c)
      }
      removeClass = function (el, c) {
        el.className = trim(el.className.replace(classReg(c), ' '))
      }
    }
  
  
    /**
     * this allows method calling for setting values
     *
     * @example
     * bonzo(elements).css('color', function (el) {
     *   return el.getAttribute('data-original-color')
     * })
     *
     * @param {Element} el
     * @param {function (Element)|string}
     * @return {string}
     */
    function setter(el, v) {
      return typeof v == 'function' ? v(el) : v
    }
  
    /**
     * @constructor
     * @param {Array.<Element>|Element|Node|string} elements
     */
    function Bonzo(elements) {
      this.length = 0
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements]
        this.length = elements.length
        for (var i = 0; i < elements.length; i++) this[i] = elements[i]
      }
    }
  
    Bonzo.prototype = {
  
        /**
         * @param {number} index
         * @return {Element|Node}
         */
        get: function (index) {
          return this[index] || null
        }
  
        // itetators
        /**
         * @param {function(Element|Node)} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , each: function (fn, opt_scope) {
          return each(this, fn, opt_scope)
        }
  
        /**
         * @param {Function} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , deepEach: function (fn, opt_scope) {
          return deepEach(this, fn, opt_scope)
        }
  
  
        /**
         * @param {Function} fn
         * @param {Function=} opt_reject
         * @return {Array}
         */
      , map: function (fn, opt_reject) {
          var m = [], n, i
          for (i = 0; i < this.length; i++) {
            n = fn.call(this, this[i], i)
            opt_reject ? (opt_reject(n) && m.push(n)) : m.push(n)
          }
          return m
        }
  
      // text and html inserters!
  
      /**
       * @param {string} h the HTML to insert
       * @param {boolean=} opt_text whether to set or get text content
       * @return {Bonzo|string}
       */
      , html: function (h, opt_text) {
          var method = opt_text
                ? html.textContent === undefined ? 'innerText' : 'textContent'
                : 'innerHTML'
            , that = this
            , append = function (el, i) {
                each(normalize(h, that, i), function (node) {
                  el.appendChild(node)
                })
              }
            , updateElement = function (el, i) {
                try {
                  if (opt_text || (typeof h == 'string' && !specialTags.test(el.tagName))) {
                    return el[method] = h
                  }
                } catch (e) {}
                append(el, i)
              }
          return typeof h != 'undefined'
            ? this.empty().each(updateElement)
            : this[0] ? this[0][method] : ''
        }
  
        /**
         * @param {string=} opt_text the text to set, otherwise this is a getter
         * @return {Bonzo|string}
         */
      , text: function (opt_text) {
          return this.html(opt_text, true)
        }
  
        // more related insertion methods
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , append: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el.appendChild(i)
            })
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , prepend: function (node) {
          var that = this
          return this.each(function (el, i) {
            var first = el.firstChild
            each(normalize(node, that, i), function (i) {
              el.insertBefore(i, first)
            })
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , appendTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.appendChild(el)
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , prependTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.insertBefore(el, t.firstChild)
          }, 1)
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , before: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el)
            })
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , after: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el.nextSibling)
            }, null, 1)
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertBefore: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t[parentNode].insertBefore(el, t)
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertAfter: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            var sibling = t.nextSibling
            sibling ?
              t[parentNode].insertBefore(el, sibling) :
              t[parentNode].appendChild(el)
          }, 1)
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , replaceWith: function (node) {
          bonzo(normalize(node)).insertAfter(this)
          return this.remove()
        }
  
        // class management
  
        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , addClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            // we `each` here so you can do $el.addClass('foo bar')
            each(c, function (c) {
              if (c && !hasClass(el, setter(el, c)))
                addClass(el, setter(el, c))
            })
          })
        }
  
  
        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , removeClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c && hasClass(el, setter(el, c)))
                removeClass(el, setter(el, c))
            })
          })
        }
  
  
        /**
         * @param {string} c
         * @return {boolean}
         */
      , hasClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return some(this, function (el) {
            return some(c, function (c) {
              return c && hasClass(el, c)
            })
          })
        }
  
  
        /**
         * @param {string} c classname to toggle
         * @param {boolean=} opt_condition whether to add or remove the class straight away
         * @return {Bonzo}
         */
      , toggleClass: function (c, opt_condition) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c) {
                typeof opt_condition !== 'undefined' ?
                  opt_condition ? addClass(el, c) : removeClass(el, c) :
                  hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
              }
            })
          })
        }
  
        // display togglers
  
        /**
         * @param {string=} opt_type useful to set back to anything other than an empty string
         * @return {Bonzo}
         */
      , show: function (opt_type) {
          opt_type = typeof opt_type == 'string' ? opt_type : ''
          return this.each(function (el) {
            el.style.display = opt_type
          })
        }
  
  
        /**
         * @return {Bonzo}
         */
      , hide: function () {
          return this.each(function (el) {
            el.style.display = 'none'
          })
        }
  
  
        /**
         * @param {Function=} opt_callback
         * @param {string=} opt_type
         * @return {Bonzo}
         */
      , toggle: function (opt_callback, opt_type) {
          opt_type = typeof opt_type == 'string' ? opt_type : '';
          typeof opt_callback != 'function' && (opt_callback = null)
          return this.each(function (el) {
            el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : opt_type;
            opt_callback && opt_callback.call(el)
          })
        }
  
  
        // DOM Walkers & getters
  
        /**
         * @return {Element|Node}
         */
      , first: function () {
          return bonzo(this.length ? this[0] : [])
        }
  
  
        /**
         * @return {Element|Node}
         */
      , last: function () {
          return bonzo(this.length ? this[this.length - 1] : [])
        }
  
  
        /**
         * @return {Element|Node}
         */
      , next: function () {
          return this.related('nextSibling')
        }
  
  
        /**
         * @return {Element|Node}
         */
      , previous: function () {
          return this.related('previousSibling')
        }
  
  
        /**
         * @return {Element|Node}
         */
      , parent: function() {
          return this.related(parentNode)
        }
  
  
        /**
         * @private
         * @param {string} method the directional DOM method
         * @return {Element|Node}
         */
      , related: function (method) {
          return this.map(
            function (el) {
              el = el[method]
              while (el && el.nodeType !== 1) {
                el = el[method]
              }
              return el || 0
            },
            function (el) {
              return el
            }
          )
        }
  
  
        /**
         * @return {Bonzo}
         */
      , focus: function () {
          this.length && this[0].focus()
          return this
        }
  
  
        /**
         * @return {Bonzo}
         */
      , blur: function () {
          this.length && this[0].blur()
          return this
        }
  
        // style getter setter & related methods
  
        /**
         * @param {Object|string} o
         * @param {string=} opt_v
         * @return {Bonzo|string}
         */
      , css: function (o, opt_v) {
          var p, iter = o
          // is this a request for just getting a style?
          if (opt_v === undefined && typeof o == 'string') {
            // repurpose 'v'
            opt_v = this[0]
            if (!opt_v) return null
            if (opt_v === doc || opt_v === win) {
              p = (opt_v === doc) ? bonzo.doc() : bonzo.viewport()
              return o == 'width' ? p.width : o == 'height' ? p.height : ''
            }
            return (o = styleProperty(o)) ? getStyle(opt_v, o) : null
          }
  
          if (typeof o == 'string') {
            iter = {}
            iter[o] = opt_v
          }
  
          if (ie && iter.opacity) {
            // oh this 'ol gamut
            iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
            // give it layout
            iter.zoom = o.zoom || 1;
            delete iter.opacity;
          }
  
          function fn(el, p, v) {
            for (var k in iter) {
              if (iter.hasOwnProperty(k)) {
                v = iter[k];
                // change "5" to "5px" - unless you're line-height, which is allowed
                (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
                try { el.style[p] = setter(el, v) } catch(e) {}
              }
            }
          }
          return this.each(fn)
        }
  
  
        /**
         * @param {number=} opt_x
         * @param {number=} opt_y
         * @return {Bonzo|number}
         */
      , offset: function (opt_x, opt_y) {
          if (opt_x && typeof opt_x == 'object' && (typeof opt_x.top == 'number' || typeof opt_x.left == 'number')) {
            return this.each(function (el) {
              xy(el, opt_x.left, opt_x.top)
            })
          } else if (typeof opt_x == 'number' || typeof opt_y == 'number') {
            return this.each(function (el) {
              xy(el, opt_x, opt_y)
            })
          }
          if (!this[0]) return {
              top: 0
            , left: 0
            , height: 0
            , width: 0
          }
          var el = this[0]
            , de = el.ownerDocument.documentElement
            , bcr = el.getBoundingClientRect()
            , scroll = getWindowScroll()
            , width = el.offsetWidth
            , height = el.offsetHeight
            , top = bcr.top + scroll.y - Math.max(0, de && de.clientTop, doc.body.clientTop)
            , left = bcr.left + scroll.x - Math.max(0, de && de.clientLeft, doc.body.clientLeft)
  
          return {
              top: top
            , left: left
            , height: height
            , width: width
          }
        }
  
  
        /**
         * @return {number}
         */
      , dim: function () {
          if (!this.length) return { height: 0, width: 0 }
          var el = this[0]
            , de = el.nodeType == 9 && el.documentElement // document
            , orig = !de && !!el.style && !el.offsetWidth && !el.offsetHeight ?
               // el isn't visible, can't be measured properly, so fix that
               function (t) {
                 var s = {
                     position: el.style.position || ''
                   , visibility: el.style.visibility || ''
                   , display: el.style.display || ''
                 }
                 t.first().css({
                     position: 'absolute'
                   , visibility: 'hidden'
                   , display: 'block'
                 })
                 return s
              }(this) : null
            , width = de
                ? Math.max(el.body.scrollWidth, el.body.offsetWidth, de.scrollWidth, de.offsetWidth, de.clientWidth)
                : el.offsetWidth
            , height = de
                ? Math.max(el.body.scrollHeight, el.body.offsetHeight, de.scrollWidth, de.offsetWidth, de.clientHeight)
                : el.offsetHeight
  
          orig && this.first().css(orig)
          return {
              height: height
            , width: width
          }
        }
  
        // attributes are hard. go shopping
  
        /**
         * @param {string} k an attribute to get or set
         * @param {string=} opt_v the value to set
         * @return {Bonzo|string}
         */
      , attr: function (k, opt_v) {
          var el = this[0]
          if (typeof k != 'string' && !(k instanceof String)) {
            for (var n in k) {
              k.hasOwnProperty(n) && this.attr(n, k[n])
            }
            return this
          }
          return typeof opt_v == 'undefined' ?
            !el ? null : specialAttributes.test(k) ?
              stateAttributes.test(k) && typeof el[k] == 'string' ?
                true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                  el[getAttribute](k, 2) : el[getAttribute](k) :
            this.each(function (el) {
              specialAttributes.test(k) ? (el[k] = setter(el, opt_v)) : el[setAttribute](k, setter(el, opt_v))
            })
        }
  
  
        /**
         * @param {string} k
         * @return {Bonzo}
         */
      , removeAttr: function (k) {
          return this.each(function (el) {
            stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
          })
        }
  
  
        /**
         * @param {string=} opt_s
         * @return {Bonzo|string}
         */
      , val: function (s) {
          return (typeof s == 'string') ?
            this.attr('value', s) :
            this.length ? this[0].value : null
        }
  
        // use with care and knowledge. this data() method uses data attributes on the DOM nodes
        // to do this differently costs a lot more code. c'est la vie
        /**
         * @param {string|Object=} opt_k the key for which to get or set data
         * @param {Object=} opt_v
         * @return {Bonzo|Object}
         */
      , data: function (opt_k, opt_v) {
          var el = this[0], o, m
          if (typeof opt_v === 'undefined') {
            if (!el) return null
            o = data(el)
            if (typeof opt_k === 'undefined') {
              each(el.attributes, function (a) {
                (m = ('' + a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
              })
              return o
            } else {
              if (typeof o[opt_k] === 'undefined')
                o[opt_k] = dataValue(this.attr('data-' + decamelize(opt_k)))
              return o[opt_k]
            }
          } else {
            return this.each(function (el) { data(el)[opt_k] = opt_v })
          }
        }
  
        // DOM detachment & related
  
        /**
         * @return {Bonzo}
         */
      , remove: function () {
          this.deepEach(clearData)
          return this.detach()
        }
  
  
        /**
         * @return {Bonzo}
         */
      , empty: function () {
          return this.each(function (el) {
            deepEach(el.childNodes, clearData)
  
            while (el.firstChild) {
              el.removeChild(el.firstChild)
            }
          })
        }
  
  
        /**
         * @return {Bonzo}
         */
      , detach: function () {
          return this.each(function (el) {
            el[parentNode] && el[parentNode].removeChild(el)
          })
        }
  
        // who uses a mouse anyway? oh right.
  
        /**
         * @param {number} y
         */
      , scrollTop: function (y) {
          return scroll.call(this, null, y, 'y')
        }
  
  
        /**
         * @param {number} x
         */
      , scrollLeft: function (x) {
          return scroll.call(this, x, null, 'x')
        }
  
    }
  
    function normalize(node, host, clone) {
      var i, l, ret
      if (typeof node == 'string') return bonzo.create(node)
      if (isNode(node)) node = [ node ]
      if (clone) {
        ret = [] // don't change original array
        for (i = 0, l = node.length; i < l; i++) ret[i] = cloneNode(host, node[i])
        return ret
      }
      return node
    }
  
    function cloneNode(host, el) {
      var c = el.cloneNode(true)
        , cloneElems
        , elElems
  
      // check for existence of an event cloner
      // preferably https://github.com/fat/bean
      // otherwise Bonzo won't do this for you
      if (host.$ && typeof host.cloneEvents == 'function') {
        host.$(c).cloneEvents(el)
  
        // clone events from every child node
        cloneElems = host.$(c).find('*')
        elElems = host.$(el).find('*')
  
        for (var i = 0; i < elElems.length; i++)
          host.$(cloneElems[i]).cloneEvents(elElems[i])
      }
      return c
    }
  
    function scroll(x, y, type) {
      var el = this[0]
      if (!el) return this
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
      }
      if (isBody(el)) {
        win.scrollTo(x, y)
      } else {
        x != null && (el.scrollLeft = x)
        y != null && (el.scrollTop = y)
      }
      return this
    }
  
    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName)
    }
  
    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
    }
  
    /**
     * @param {Array.<Element>|Element|Node|string} els
     * @return {Bonzo}
     */
    function bonzo(els) {
      return new Bonzo(els)
    }
  
    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine
    }
  
    bonzo.aug = function (o, target) {
      // for those standalone bonzo users. this love is for you.
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
      }
    }
  
    bonzo.create = function (node) {
      // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
      return typeof node == 'string' && node !== '' ?
        function () {
          var tag = /^\s*<([^\s>]+)/.exec(node)
            , el = doc.createElement('div')
            , els = []
            , p = tag ? tagMap[tag[1].toLowerCase()] : null
            , dep = p ? p[2] + 1 : 1
            , ns = p && p[3]
            , pn = parentNode
            , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)
  
          el.innerHTML = p ? (p[0] + node + p[1]) : node
          while (dep--) el = el.firstChild
          // for IE NoScope, we may insert cruft at the begining just to get it to work
          if (ns && el && el.nodeType !== 1) el = el.nextSibling
          do {
            // tbody special case for IE<8, creates tbody on any empty table
            // we don't want it if we're just after a <thead>, <caption>, etc.
            if ((!tag || el.nodeType == 1) && (!tb || el.tagName.toLowerCase() != 'tbody')) {
              els.push(el)
            }
          } while (el = el.nextSibling)
          // IE < 9 gives us a parentNode which messes up insert() check for cloning
          // `dep` > 1 can also cause problems with the insert() check (must do this last)
          each(els, function(el) { el[pn] && el[pn].removeChild(el) })
          return els
        }() : isNode(node) ? [node.cloneNode(true)] : []
    }
  
    bonzo.doc = function () {
      var vp = bonzo.viewport()
      return {
          width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
        , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      }
    }
  
    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) e = c[j = i]
      }
      return e
    }
  
    bonzo.viewport = function () {
      return {
          width: ie ? html.clientWidth : self.innerWidth
        , height: ie ? html.clientHeight : self.innerHeight
      }
    }
  
    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true
          }
        }
        return false
      }
  
    return bonzo
  }, this); // the only line we care about using a semi-colon. placed here for concatenation tools
  

  provide("bonzo", module.exports);

  (function ($) {
  
    var b = require('bonzo')
    b.setQueryEngine($)
    $.ender(b)
    $.ender(b(), true)
    $.ender({
      create: function (node) {
        return $(b.create(node))
      }
    })
  
    $.id = function (id) {
      return $([document.getElementById(id)])
    }
  
    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
      return -1
    }
  
    function uniq(ar) {
      var r = [], i = 0, j = 0, k, item, inIt
      for (; item = ar[i]; ++i) {
        inIt = false
        for (k = 0; k < r.length; ++k) {
          if (r[k] === item) {
            inIt = true; break
          }
        }
        if (!inIt) r[j++] = item
      }
      return r
    }
  
    $.ender({
      parents: function (selector, closest) {
        if (!this.length) return this
        if (!selector) selector = '*'
        var collection = $(selector), j, k, p, r = []
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j]
          while (p = p.parentNode) {
            if (~indexOf(collection, p)) {
              r.push(p)
              if (closest) break;
            }
          }
        }
        return $(uniq(r))
      }
  
    , parent: function() {
        return $(uniq(b(this).parent()))
      }
  
    , closest: function (selector) {
        return this.parents(selector, true)
      }
  
    , first: function () {
        return $(this.length ? this[0] : this)
      }
  
    , last: function () {
        return $(this.length ? this[this.length - 1] : [])
      }
  
    , next: function () {
        return $(b(this).next())
      }
  
    , previous: function () {
        return $(b(this).previous())
      }
  
    , appendTo: function (t) {
        return b(this.selector).appendTo(t, this)
      }
  
    , prependTo: function (t) {
        return b(this.selector).prependTo(t, this)
      }
  
    , insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this)
      }
  
    , insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this)
      }
  
    , siblings: function () {
        var i, l, p, r = []
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i]
          while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
          p = this[i]
          while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
        }
        return $(r)
      }
  
    , children: function () {
        var i, l, el, r = []
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) continue;
          r.push(el)
          while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
        }
        return $(uniq(r))
      }
  
    , height: function (v) {
        return dimension.call(this, 'height', v)
      }
  
    , width: function (v) {
        return dimension.call(this, 'width', v)
      }
    }, true)
  
    /**
     * @param {string} type either width or height
     * @param {number=} opt_v becomes a setter instead of a getter
     * @return {number}
     */
    function dimension(type, opt_v) {
      return typeof opt_v == 'undefined'
        ? b(this).dim()[type]
        : this.css(type, opt_v)
    }
  }(ender));

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  !function(name, context, definition) {
  	if (typeof module !== 'undefined') module.exports = definition(ender);
  	else if (typeof define === 'function' && typeof define.amd === 'object') define(ender);
  	else context[name] = definition(ender);
  }('diaglit.controls', this, function($) {
  	var _controls = {},
  		_ = require('underscore'),
  		control_tpl = _.template('\
  			<div class="control-group">\
  				<label class="control-label" for="<%= name %>"><%= label %></label>\
  				<div class="controls">\
  					<% if(help) { %>\
  						<span class="help-block"><%= help %></span>\
  					<% } %>\
  				</div>\
  			</div>')
  
  		//export control type
  		_.each(['text', 'time', 'date', 'datetime', 'password', 'email', 'range', 'number'], function(ctrl) {
  			_controls[ctrl] = field(input);
  		});
  
  	//textarea control	
  	_controls['textarea'] = field(function(control, data) {
  		var prop = _.extend(control, {
  			id: control.name
  		});
  
  		return $('<textarea>').attr(prop).text(data && data[control.name] || control.value);
  	});
  
  	//input type hidden doesn't need field
  	_controls['hidden'] = input;
  
  	//select option field
  	_controls['select'] = field(function(control, data) {
  		var t_opt = _.template('<option <%=selected%> value="<%=value %>" ><%=label%></option>'),
  			prop = _(control).clone();
  
  		//removing options from select properties
  		delete prop['options']
  
  		return _(control.options).map(getOption).map(function(opt) {
  			opt['selected'] = data && data[control.name] == opt['value'] || !! opt['selected'] ? 'selected' : '';
  			return t_opt(opt)
  		}).reduce(function(select, opt) {
  			return select.append(opt)
  		}, $('<select>').attr(prop))
  	})
  
  	_controls['radio'] = _controls['checkbox'] = field(function(control,data){
  		var t_control = _.template('\
  			<label class="<%= type %>">\
                <input type="<%= type %>" name="<%=name %>" <%=checked %> value="<%=value %>"><%=label%>\
              </label>');
  
  		return _(control.options)
  			.map(getOption)
  			.map(function(opt){
  				opt['name'] = control['name'];
  				opt['type'] = control['type'];
  				return opt
  			}).map(function(opt){
  				if (opt['checked'] 
  						&& data
  						&& data[opt.name] 
  						&& data[opt.name] != opt.value ){
  					opt['checked'] = null 
  				}
  				opt['checked'] = data && data[control.name] == opt['value'] || !! opt['checked'] ? 'checked' : '';
  				return t_control(opt)
  			}).reduce(function(base,html){
  				return base + html
  			},'')
  	})
  
  	// field generator
  	function field(makeInput) {
  		return function(control, data) {
  			var label = control.label ||
  			function(name) {
  				return name.charAt(0).toUpperCase() + name.substring(1).replace('_', ' ');
  			}, _field = $(control_tpl({
  				name: control.name,
  				label: _.isFunction(label) ? label(control.name) : label,
  				help: control.help
  			}))
  			_field.find('.controls').prepend(makeInput(control, data))
  
  			return _field
  		}
  	}
  
  	// input generator
  
  	function input(control, data) {
  		control['value'] = data && data[control.name] || control['value'];
  		return $('<input>').attr(_(control).extend({
  			'id': control.name
  		})).css('height', 'auto'); // ??? fix ???
  	}
  
  	function getOption(opt){
  		return (_.isString(opt)) ? {
  			'value': opt,
  			'label': opt
  		} : opt ;
  	}
  
  	_controls['NotImplementedException'] = function(type) {
  		this.message = type + " is not implemented"
  	}
  	_controls['NotImplementedException'].prototype = new Error()
  	_controls['NotImplementedException'].prototype.name = 'NotImplementedException'
  
  	Object.defineProperties(_controls, {
  		'field': {
  			enumerable: false,
  			value: function(field, data) {
  				if ( !! field.type && !_controls[field.type]) {
  					throw new _controls['NotImplementedException'](field.type)
  				}
  				return _controls[field.type || 'text'](_(field).defaults({
  					type: 'text'
  				}), data)
  			},
  		}
  	})
  
  	return _controls
  })

  provide("diaglit.controls", module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*global provide:true,ender:true*/
  // make a fake `ender` that can do some things slightly different
  !(function ($) {
    var faker = function (selector) {
          return selector === null || selector === '#' ? $([]) : $.apply(this, arguments)
        }
      , hasNewBean = !!require('bean').on
      , _$map = $.fn.map
      , _$on = $.fn.on
      , _$trigger = $.fn.trigger
      , _$data = $.fn.data
      , p
  
    for (p in $) {
      if (Object.prototype.hasOwnProperty.call($, p))
        faker[p] = $[p]
    }
    if (!faker.support) faker.support = {}
  
    // $.camelCase
    faker.camelCase = function (s) {
      return s.replace(/-([a-z]|[0-9])/ig, function (s, c) { return (c + '').toUpperCase() })
    }
    // $.extend(dst, src1, src2...)
    // simple shallow copy
    faker.extend = function () {
      var options, name, src, copy
        , target = arguments[0], i = 1, length = arguments.length
  
      for (; i < length; i++) {
        if ((options = arguments[i]) !== null) {
          for (name in options) {
            src = target[name]
            copy = options[name]
            if (target !== copy)
              target[name] = copy
          }
        }
      }
      return target
    }
    // $.map
    faker.map = function (a, fn, scope) {
      var r = [], tr, i, l
      for (i = 0, l = a.length; i < l; i++) {
        i in a && (tr = fn.call(scope, a[i], i, a)) != null && r.push(tr)
      }
      return r
    }
    // $.proxy
    faker.proxy = function (fn, ctx) {
      return function () { return fn.apply(ctx, arguments) }
    }
    // simplified version of jQuery's $.grep
    faker.grep = function (elems, callback) {
      var i = 0, l = elems.length, ret = []
      for (; i < l; i++) {
        if (!!callback(elems[i], i))
          ret.push(elems[i])
      }
      return ret;
    }
    // no index arg needed just yet
    faker.inArray = Array.prototype.indexOf
      ? function (el, arr) {
          return Array.prototype.indexOf.call(arr, el)
        }
      : function (el, arr) {
          for (var i = 0; i < arr.length; i++)
            if (arr[i] === el) return i
          return -1
        }
  
    // this is just nasty... Bootstrap uses $.Event(foo) so it can track state, we can't do that
    // with Bean but we need to pass Bean a string for trigger()
    faker.Event = function (s) {
      return s
    }
  
    // fix $().map to handle argument-less functions
    // also the explicit rejection of null values
    $.fn.map = function (fn) {
      if (!fn.length) { // no args
        return $(_$map.call(this, function (e) { return fn.call(e) }, function (e) { return e != null }))
      }
      return $(_$map.apply(this, arguments))
    }
    // fix $().on to handle jQuery style arguments
    $.fn.on = function () {
      // 'data' argument, can't use it, perhaps pass it as last arg?
      if (arguments.length == 3 && typeof arguments[2] == 'function' && typeof arguments[1] != 'string')
        return $.fn.bind.call(this, arguments[0], arguments[2])
      // this argument switch only needs to happen for old Bean
      else if (!hasNewBean && arguments.length == 3 && typeof arguments[2] == 'function' && typeof arguments[1] == 'string')
        return $.fn.bind.call(this, arguments[1], arguments[0], arguments[2])
      return _$on.apply(this, arguments)
    }
    // don't handle $().trigger({}) (object parameters)
    $.fn.trigger = function () {
      if (typeof arguments[0] == 'string')
        return _$trigger.apply(this, arguments)
      if (typeof arguments[0] == 'object' && typeof arguments[0].type == 'string')
        return _$trigger.call(this, arguments[0].type)
      return this
    }
    // fix $().data() to handle a JSON array for typeahead's "source"
    $.fn.data = function () {
      var d = _$data.apply(this, arguments)
      if (!arguments.length && typeof d.source == 'string' && /^\[/.test(d.source)) {
        if (typeof JSON != 'undefined' && JSON.parse) {
          d.source = JSON.parse(d.source)
        } else {
          d.source = d.source.replace(/(^\s*[\s*")|("\s*]\s*$)/g, '').split(/"\s*,\s*"/)
        }
      }
      return d
    }
    // implement sort which is awkward because Array.prototype.sort won't sort an Ender object
    $.fn.sort = function (fn) {
      var ar = []
      for (var i = 0; i < this.length; i++) ar[i] = this[i]
      ar.sort(fn)
      return $(ar)
    }
    // for carousel.to()
    if (!$.fn.index) {
      //TODO: support collections of elements for dropdown.js, move implementation to Traversty
      $.fn.index = function (el) {
        if (el && (!!el.nodeType || (!!(el = el[0]) && !!el.nodeType))) {
          for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] === el) return i
          }
        }
        return -1
      }
    }
  
    // lifted from jQuery, modified slightly
    var rroot = /^(?:body|html)$/i
    $.fn.position = function () {
      if (!this.length)
        return null
  
      var elem = this[0],
      // Get *real* offsetParent
      offsetParent = this.offsetParent(),
  
      // Get correct offsets
      offset       = this.offset(),
      parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()
  
      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat($(elem).css("marginTop")) || 0
      offset.left -= parseFloat($(elem).css("marginLeft")) || 0
  
      // Add offsetParent borders
      parentOffset.top  += parseFloat($(offsetParent[0]).css("borderTopWidth")) || 0
      parentOffset.left += parseFloat($(offsetParent[0]).css("borderLeftWidth")) || 0
  
      // Subtract the two offsets
      return {
          top:  offset.top  - parentOffset.top
        , left: offset.left - parentOffset.left
      }
    }
    $.fn.offsetParent = function () {
      return $(this.map(function () {
        var offsetParent = this.offsetParent || document.body
        while (offsetParent && (!rroot.test(offsetParent.nodeName) && $(offsetParent).css("position") === "static")) {
          offsetParent = offsetParent.offsetParent
        }
        return offsetParent
      }))
    }
  
    // if (typeof module !== 'undefined') module.exports = faker
    if (typeof provide !== 'undefined') provide('ender-bootstrap-base-faker', faker)
    // else, where are we??
  
  
  }(ender))
  

  provide("ender-bootstrap-base", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ===================================================
   * bootstrap-transition.js v2.2.1
   * http://twitter.github.com/bootstrap/javascript.html#transitions
   * ===================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
    /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
     * ======================================================= */
  
    $.domReady(function () {
  
      $.support.transition = (function () {
  
        var transitionEnd = (function () {
  
          var el = document.createElement('bootstrap')
            , transEndEventNames = {
                 'WebkitTransition' : 'webkitTransitionEnd'
              ,  'MozTransition'    : 'transitionend'
              ,  'OTransition'      : 'oTransitionEnd otransitionend'
              ,  'transition'       : 'transitionend'
              }
            , name
  
          for (name in transEndEventNames){
            if (el.style[name] !== undefined) {
              return transEndEventNames[name]
            }
          }
  
        }())
  
        return transitionEnd && {
          end: transitionEnd
        }
  
      })()
  
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-transition", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bowser - a browser detector
    * https://github.com/ded/bowser
    * MIT License | (c) Dustin Diaz 2011
    */
  !function (name, definition) {
    if (typeof define == 'function') define(definition)
    else if (typeof module != 'undefined' && module.exports) module.exports['browser'] = definition()
    else this[name] = definition()
  }('bowser', function () {
    /**
      * navigator.userAgent =>
      * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
      * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
      * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
      * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
      * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
      * iPhone:  "Mozilla/5.0 (iPhone Simulator; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5"
      * iPad:    "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
      * Android: "Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; T-Mobile G2 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
      * Touchpad: "Mozilla/5.0 (hp-tabled;Linux;hpwOS/3.0.5; U; en-US)) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0"
      */
  
    var ua = navigator.userAgent
      , t = true
      , ie = /msie/i.test(ua)
      , chrome = /chrome/i.test(ua)
      , safari = /safari/i.test(ua) && !chrome
      , iphone = /iphone/i.test(ua)
      , ipad = /ipad/i.test(ua)
      , touchpad = /touchpad/i.test(ua)
      , android = /android/i.test(ua)
      , opera = /opera/i.test(ua)
      , firefox = /firefox/i.test(ua)
      , gecko = /gecko\//i.test(ua)
      , seamonkey = /seamonkey\//i.test(ua)
      , webkitVersion = /version\/(\d+(\.\d+)?)/i
      , o
  
    function detect() {
  
      if (ie) return {
          msie: t
        , version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
      }
      if (chrome) return {
          webkit: t
        , chrome: t
        , version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
      }
      if (touchpad) return {
          webkit: t
        , touchpad: t
        , version : ua.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
      }
      if (iphone || ipad) {
        o = {
            webkit: t
          , mobile: t
          , ios: t
          , iphone: iphone
          , ipad: ipad
        }
        // WTF: version is not part of user agent in web apps
        if (webkitVersion.test(ua)) {
          o.version = ua.match(webkitVersion)[1]
        }
        return o
      }
      if (android) return {
          webkit: t
        , android: t
        , mobile: t
        , version: ua.match(webkitVersion)[1]
      }
      if (safari) return {
          webkit: t
        , safari: t
        , version: ua.match(webkitVersion)[1]
      }
      if (opera) return {
          opera: t
        , version: ua.match(webkitVersion)[1]
      }
      if (gecko) {
        o = {
            gecko: t
          , mozilla: t
          , version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
        }
        if (firefox) o.firefox = t
        return o
      }
      if (seamonkey) return {
          seamonkey: t
        , version: ua.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
      }
    }
  
    var bowser = detect()
  
    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if ((bowser.msie && bowser.version >= 7) ||
        (bowser.chrome && bowser.version >= 10) ||
        (bowser.firefox && bowser.version >= 4.0) ||
        (bowser.safari && bowser.version >= 5) ||
        (bowser.opera && bowser.version >= 10.0)) {
      bowser.a = t;
    }
  
    else if ((bowser.msie && bowser.version < 7) ||
        (bowser.chrome && bowser.version < 10) ||
        (bowser.firefox && bowser.version < 4.0) ||
        (bowser.safari && bowser.version < 5) ||
        (bowser.opera && bowser.version < 10.0)) {
      bowser.c = t
    } else bowser.x = t
  
    return bowser
  })
  

  provide("bowser", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /***************************************************************
    * Traversty: A DOM collection management and traversal utility
    * (c) Rod Vagg (@rvagg) 2012
    * https://github.com/rvagg/traversty
    * License: MIT
    */
  
  !(function (name, definition) {
    if (typeof module !== 'undefined') module.exports = definition()
    else if (typeof define === 'function' && define.amd) define(name, definition)
    else this[name] = definition()
  }('traversty', function () {
  
    var context = this
      , old = context.traversty
      , doc = window.document
      , html = doc.documentElement
      , toString = Object.prototype.toString
      , Ap = Array.prototype
      , slice = Ap.slice
        // feature test to find native matchesSelector()
      , matchesSelector = (function (el, pfx, name, i, ms) {
          while (i < pfx.length)
            if (el[ms = pfx[i++] + name]) return ms
        }(html, [ 'msM', 'webkitM', 'mozM', 'oM', 'm' ], 'atchesSelector', 0))
  
      , Kfalse = function () { return false }
  
      , isNumber = function (o) {
          return toString.call(o) === '[object Number]'
        }
  
      , isString = function (o) {
          return toString.call(o) === '[object String]'
        }
  
      , isFunction = function (o) {
          return toString.call(o) === '[object Function]'
        }
  
      , isUndefined = function (o) {
          return o === void 0
        }
  
      , isElement = function (o) {
          return o && o.nodeType === 1
        }
  
        // figure out which argument, if any, is our 'index'
      , getIndex = function (selector, index) {
          return isUndefined(selector) && !isNumber(index) ? 0 :
            isNumber(selector) ? selector : isNumber(index) ? index : null
        }
  
        // figure out which argument, if any, is our 'selector'
      , getSelector = function (selector) {
          return isString(selector) ? selector : '*'
        }
  
      , nativeSelectorFind = function (selector, el) {
          return slice.call(el.querySelectorAll(selector), 0)
        }
  
      , nativeSelectorMatches = function (selector, el) {
          return selector === '*' || el[matchesSelector](selector)
        }
  
      , selectorFind = nativeSelectorFind
  
      , selectorMatches = nativeSelectorMatches
  
        // used in the case where our selector engine does out-of-order element returns for
        // grouped selectors, e.g. '.class, tag', we need our elements in document-order
        // so we do it ourselves if need be
      , createUnorderedEngineSelectorFind = function(engineSelect, selectorMatches) {
          return function (selector, el) {
            if (/,/.test(selector)) {
              var ret = [], i = -1, els = el.getElementsByTagName('*')
              while (++i < els.length) {
                if (isElement(els[i]) && selectorMatches(selector, els[i])) ret.push(els[i])
              }
              return ret
            }
            return engineSelect(selector, el)
          }
        }
  
        // is 'element' underneath 'container' somewhere
      , isAncestor = 'compareDocumentPosition' in html
          ? function (element, container) {
              return (container.compareDocumentPosition(element) & 16) == 16
            }
          : 'contains' in html
            ? function (element, container) {
                container = container.nodeType === 9 || container == window ? html : container
                return container !== element && container.contains(element)
              }
            : function (element, container) { // old smelly browser
                while (element = element.parentNode) if (element === container) return 1
                return 0
              }
  
        // return an array containing only unique elements
      , unique = function (ar) {
          var a = [], i = -1, j, has
          while (++i < ar.length) {
            j = -1
            has = false
            while (++j < a.length) {
              if (a[j] === ar[i]) {
                has = true
                break
              }
            }
            if (!has) a.push(ar[i])
          }
          return a
        }
  
        // for each element of 'els' execute 'fn' to get an array of elements to collect
      , collect = function (els, fn) {
          var ret = [], res, i = 0, j, l = els.length, l2
          while (i < l) {
            j = 0
            l2 = (res = fn(els[i], i++)).length
            while (j < l2) ret.push(res[j++])
          }
          return ret
        }
  
       // generic DOM navigator to move multiple elements around the DOM
     , move = function (els, method, selector, index, filterFn) {
          index = getIndex(selector, index)
          selector = getSelector(selector)
          return collect(els
            , function (el, elind) {
                var i = index || 0, ret = []
                if (!filterFn)
                  el = el[method]
                while (el && (index === null || i >= 0)) {
                  // ignore non-elements, only consider selector-matching elements
                  // handle both the index and no-index (selector-only) cases
                  if (isElement(el)
                      && (!filterFn || filterFn === true || filterFn(el, elind))
                      && selectorMatches(selector, el)
                      && (index === null || i-- === 0)) {
                    // this concat vs push is to make sure we add elements to the result array
                    // in reverse order when doing a previous(selector) and up(selector)
                    index === null && method !== 'nextSibling' ? ret = [el].concat(ret) : ret.push(el)
                  }
                  el = el[method]
                }
                return ret
              }
          )
        }
  
        // given an index & length, return a 'fixed' index, fixes non-numbers & neative indexes
      , eqIndex = function (length, index, def) {
          if (index < 0) index = length + index
          if (index < 0 || index >= length) return null
          return !index && index !== 0 ? def : index
        }
  
        // collect elements of an array that match a filter function
      , filter = function (els, fn) {
          var arr = [], i = 0, l = els.length
          for (; i < l; i++)
            fn(els[i], i) && arr.push(els[i])
          return arr
        }
  
        // create a filter function, for use by filter(), is() & not()
        // allows the argument to be an element, a function or a selector
      , filterFn = function (slfn) {
          var to
          return isElement(slfn)
            ? function (el) { return el === slfn }
            : (to = typeof slfn) == 'function'
              ? function (el, i) { return slfn.call(el, i) }
              : to == 'string' && slfn.length
                ? function (el) { return selectorMatches(slfn, el) }
                : Kfalse
        }
  
        // fn = !fn
      , inv = function (fn) {
          return function () {
            return !fn.apply(this, arguments)
          }
        }
  
      , traversty = (function () {
          function T(els) {
            this.length = 0
            if (els) {
              els = unique(!els.nodeType && !isUndefined(els.length) ? els : [ els ])
              var i = this.length = els.length
              while (i--) this[i] = els[i]
            }
          }
  
          T.prototype = {
              down: function (selector, index) {
                index = getIndex(selector, index)
                selector = getSelector(selector)
                return traversty(collect(this
                  , function (el) {
                      var f = selectorFind(selector, el)
                      return index === null ? f : ([ f[index] ] || [])
                    }
                  ))
              }
  
            , up: function (selector, index) {
                return traversty(move(this, 'parentNode', selector, index))
              }
  
            , parents: function () {
                return T.prototype.up.apply(this, arguments.length ? arguments : [ '*' ])
              }
  
            , closest: function (selector, index) {
                if (isNumber(selector)) {
                  index = selector
                  selector = '*'
                } else if (!isString(selector)) {
                  return traversty([])
                } else if (!isNumber(index)) {
                  index = 0
                }
                return traversty(move(this, 'parentNode', selector, index, true))
              }
  
            , previous: function (selector, index) {
                return traversty(move(this, 'previousSibling', selector, index))
              }
  
            , next: function (selector, index) {
                return traversty(move(this, 'nextSibling', selector, index))
              }
  
            , siblings: function (selector, index) {
                var self = this
                  , arr = slice.call(this, 0)
                  , i = 0, l = arr.length
                for (; i < l; i++) {
                  arr[i] = arr[i].parentNode.firstChild
                  while (!isElement(arr[i])) arr[i] = arr[i].nextSibling
                }
                if (isUndefined(selector))
                  selector = '*'
  
                return traversty(move(arr, 'nextSibling', selector || '*', index
                      , function (el, i) { return el !== self[i] } // filter
                    ))
              }
  
            , children: function (selector, index) {
                return traversty(move(T.prototype.down.call(this), 'nextSibling', selector || '*', index, true))
              }
  
            , first: function () {
                return T.prototype.eq.call(this, 0)
              }
  
            , last: function () {
                return T.prototype.eq.call(this, -1)
              }
  
            , eq: function (index) {
                return traversty(this.get(index))
              }
  
            , get: function (index) {
                return this[eqIndex(this.length, index, 0)]
              }
  
              // a crazy man wrote this, don't try to understand it, see the tests
            , slice: function (start, end) {
                var e = end, l = this.length, arr = []
                start = eqIndex(l, Math.max(-this.length, start), 0)
                e = eqIndex(end < 0 ? l : l + 1, end, l)
                end = e === null || e > l ? end < 0 ? 0 : l : e
                while (start !== null && start < end)
                  arr.push(this[start++])
                return traversty(arr)
              }
  
            , filter: function (slfn) {
                return traversty(filter(this, filterFn(slfn)))
              }
  
            , not: function (slfn) {
                return traversty(filter(this, inv(filterFn(slfn))))
              }
  
              // similar to filter() but cares about descendent elements
            , has: function (slel) {
                return traversty(filter(
                    this
                  , isElement(slel)
                      ? function (el) { return isAncestor(slel, el) }
                      : typeof slel == 'string' && slel.length
                        ? function (el) { return selectorFind(slel, el).length } //TODO: performance
                        : Kfalse
                ))
              }
  
              // same as filter() but return a boolean so quick-return after first successful find
            , is: function (slfn) {
                var i = 0, l = this.length
                  , fn = filterFn(slfn)
                for (; i < l; i++)
                  if (fn(this[i], i)) return true
                return false
              }
  
            , toArray: function () { return Ap.slice.call(this) }
  
            , size: function () { return this.length }
  
            , each: function (fn, ctx) {
                var i = 0, l = this.length
                for (; i < l; i++)
                  fn.call(ctx || this[i], this[i], i, this)
                return this
              }
  
              // quack like a duck (Array)
            , push: Ap.push
            , sort: Ap.sort
            , splice: Ap.splice
          }
  
          T.prototype.prev = T.prototype.previous
  
          function t(els) {
            return new T(isString(els) ? selectorFind(els, doc) : els)
          }
  
          // extend traversty functionality with custom methods
          t.aug = function (methods) {
            var key, method
            for (key in methods) {
              method = methods[key]
              if (typeof method == 'function') {
                T.prototype[key] = method
              }
            }
          }
  
  
          t.setSelectorEngine = function (s) {
            // feature testing the selector engine like a boss
            var ss, r, a, _selectorMatches, _selectorFind
              , e = doc.createElement('p')
              , select = s.select || s.sel || s
  
            e.innerHTML = '<a/><i/><b/>'
            a = e.firstChild
            try {
              // YO! I HEARD YOU LIKED NESTED TERNARY OPERATORS SO I COOKED SOME UP FOR YOU!
              // (one day I might loop this...)
  
              // check to see how we do a matchesSelector
              _selectorMatches = isFunction(s.matching)
                ? function (selector, el) { return s.matching([el], selector).length > 0 }
                : isFunction(s.is)
                  ? function (selector, el) { return s.is(el, selector) }
                  : isFunction(s.matchesSelector)
                    ? function (selector, el) { return s.matchesSelector(el, selector) }
                    : isFunction(s.match)
                      ? function (selector, el) { return s.match(el, selector) }
                      : isFunction(s.matches)
                        ? function (selector, el) { return s.matches(el, selector) }
                        : null
  
              if (!_selectorMatches) {
                // perhaps it's an selector(x).is(y) type selector?
                ss = s('a', e)
                _selectorMatches = isFunction(ss._is)
                  ? function (selector, el) { return s(el)._is(selector) } // original .is(), replaced by Enderbridge
                  : isFunction(ss.matching)
                    ? function (selector, el) { return s(el).matching(selector).length > 0 }
                    : isFunction(ss.is) && !ss.is.__ignore
                      ? function (selector, el) { return s(el).is(selector) }
                        : isFunction(ss.matchesSelector)
                          ? function (selector, el) { return s(el).matchesSelector(selector) }
                          : isFunction(ss.match)
                            ? function (selector, el) { return s(el).match(selector) }
                            : isFunction(ss.matches)
                              ? function (selector, el) { return s(el).matches(selector) }
                              : null
              }
  
              if (!_selectorMatches)
                  throw new Error('Traversty: couldn\'t find selector engine\'s `matchesSelector`')
  
              // verify that we have a working `matchesSelector`
              if (_selectorMatches('x,y', e) || !_selectorMatches('a,p', e))
                  throw new Error('Traversty: couldn\'t make selector engine\'s `matchesSelector` work')
  
              // basic select
              if ((r = select('b,a', e)).length !== 2) throw new Error('Traversty: don\'t know how to use this selector engine')
              // check to see if the selector engine has given us the results in document-order
              // and if not, work around it
              _selectorFind = r[0] === a ? select : createUnorderedEngineSelectorFind(select, _selectorMatches)
              // have we done enough to get a working `selectorFind`?
              if ((r = _selectorFind('b,a', e)).length !== 2 || r[0] !== a)
                throw new Error('Traversty: couldn\'t make selector engine work')
  
              selectorMatches = _selectorMatches
              selectorFind = _selectorFind
            } catch (ex) {
              if (isString(ex)) throw ex
              throw new Error('Traversty: error while figuring out how the selector engine works: ' + (ex.message || ex))
            } finally {
              e = null
            }
  
            return t
          }
  
          t.noConflict = function () {
            context.traversty = old
            return this
          }
  
          return t
        }())
   
    return traversty
  }));
  

  provide("traversty", module.exports);

  /*global ender:true*/
  
  (function ($) {
    var t = require('traversty')
      , integrated = false
      , integrate = function (meth) {
          // this crazyness is for lazy initialisation because we can't be guaranteed
          // that a selector engine has been installed *before* traversty in an ender build
          var fn = function (self, selector, index) {
              if (!integrated) {
                try {
                  t.setSelectorEngine($)
                } catch (ex) { } // ignore exception, we may have an ender build with no selector engine
                integrated = true
              }
              fn = meth == 'is'
                ? function (self, slfn) {
                    return t(self)[meth](slfn) // boolean
                  }
                : function (self, selector, index) {
                    return $(t(self)[meth](selector, index)) // collection
                  }
              return fn(self, selector, index)
            }
          return function (selector, index) { return fn(this, selector, index) }
        }
      , methods = 'up down next previous prev parents closest siblings children first last eq slice filter not is has'.split(' ')
      , b = {}, i = methods.length
  
    // does this build have an .is()? if so, shift it to _is() for traversty to use and
    // allow us to integrate a new is(), wrapped around it
    if ($.fn.is) $.fn._is = $.fn.is
    while (--i >= 0) b[methods[i]] = integrate(methods[i])
    $.ender(b, true)
    $.fn.is.__ignore = true
  }(ender))

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * domready (c) Dustin Diaz 2012 - License MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else this[name] = definition()
  }('domready', function (ready) {
  
    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , readyState = 'readyState'
      , loaded = /^loade|c/.test(doc[readyState])
  
    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }
  
    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)
  
  
    hack && doc.attachEvent(onreadystatechange, fn = function () {
      if (/^c/.test(doc[readyState])) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    })
  
    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })
  })

  provide("domready", module.exports);

  !function ($) {
    var ready = require('domready')
    $.ender({domReady: ready})
    $.ender({
      ready: function (f) {
        ready(f)
        return this
      }
    }, true)
  }(ender);

}());



(function () {

  var module = { exports: {} }, exports = module.exports;

  /* =========================================================
   * bootstrap-modal.js v2.2.1
   * http://twitter.github.com/bootstrap/javascript.html#modals
   * =========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================= */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* MODAL CLASS DEFINITION
    * ====================== */
  
    var Modal = function (element, options) {
      this.options = options
      this.$element = $(element)
        .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
      this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
    }
  
    Modal.prototype = {
  
        constructor: Modal
  
      , toggle: function () {
          return this[!this.isShown ? 'show' : 'hide']()
        }
  
      , show: function () {
          var that = this
            , e = $.Event('show')
  
          this.$element.trigger(e)
  
          if (this.isShown || false) return
  
          this.isShown = true
  
          this.escape()
  
          this.backdrop(function () {
            var transition = $.support.transition && that.$element.hasClass('fade')
  
            if (!that.$element.parent().length) {
              that.$element.appendTo(document.body) //don't move modals dom position
            }
  
            that.$element.show('block')
  
            if (transition) {
              that.$element[0].offsetWidth // force reflow
            }
  
            that.$element
              .addClass('in')
              .attr('aria-hidden', false)
  
            that.enforceFocus()
  
            transition ?
              that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
              that.$element.focus().trigger('shown')
  
          })
        }
  
      , hide: function (e) {
          e && e.preventDefault()
  
          var that = this
  
          e = $.Event('hide')
  
          this.$element.trigger(e)
  
          if (!this.isShown || false) return
  
          this.isShown = false
  
          this.escape()
  
          $(document).off('focusin.modal')
  
          this.$element
            .removeClass('in')
            .attr('aria-hidden', true)
  
          $.support.transition && this.$element.hasClass('fade') ?
            this.hideWithTransition() :
            this.hideModal()
        }
  
      , enforceFocus: function () {
          var that = this
          $(document).on('focusin.modal', function (e) {
            if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
              that.$element.focus()
            }
          })
        }
  
      , escape: function () {
          var that = this
          if (this.isShown && this.options.keyboard) {
            this.$element.on('keyup.dismiss.modal', function ( e ) {
              e.which == 27 && that.hide()
            })
          } else if (!this.isShown) {
            this.$element.off('keyup.dismiss.modal')
          }
        }
  
      , hideWithTransition: function () {
          var that = this
            , timeout = setTimeout(function () {
                that.$element.off($.support.transition.end)
                that.hideModal()
              }, 500)
  
          this.$element.one($.support.transition.end, function () {
            clearTimeout(timeout)
            that.hideModal()
          })
        }
  
      , hideModal: function (that) {
          this.$element
            .hide()
            .trigger('hidden')
  
          this.backdrop()
        }
  
      , removeBackdrop: function () {
          this.$backdrop.remove()
          this.$backdrop = null
        }
  
      , backdrop: function (callback) {
          var that = this
            , animate = this.$element.hasClass('fade') ? 'fade' : ''
  
          if (this.isShown && this.options.backdrop) {
            var doAnimate = $.support.transition && animate
  
            this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
              .appendTo(document.body)
  
            this.$backdrop.click(
              this.options.backdrop == 'static' ?
                $.proxy(this.$element[0].focus, this.$element[0])
              : $.proxy(this.hide, this)
            )
  
            if (doAnimate) this.$backdrop[0].offsetWidth // force reflow
  
            this.$backdrop.addClass('in')
  
            doAnimate ?
              this.$backdrop.one($.support.transition.end, callback) :
              callback()
  
          } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass('in')
  
            $.support.transition && this.$element.hasClass('fade')?
              this.$backdrop.one($.support.transition.end, $.proxy(this.removeBackdrop, this)) :
              this.removeBackdrop()
  
          } else if (callback) {
            callback()
          }
        }
    }
  
  
   /* MODAL PLUGIN DEFINITION
    * ======================= */
  
    $.fn.modal = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('modal')
          , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
        if (!data) $this.data('modal', (data = new Modal(this, options)))
        if (typeof option == 'string') data[option]()
        else if (options.show) data.show()
      })
    }
  
    $.fn.modal.defaults = {
        backdrop: true
      , keyboard: true
      , show: true
    }
  
    $.fn.modal.Constructor = Modal
  
  
   /* MODAL DATA-API
    * ============== */
  
    $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
      var $this = $(this)
        , href = $this.attr('href')
        , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
        , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())
  
      e.preventDefault()
  
      $target
        .modal(option)
        .one('hide', function () {
          $this.focus()
        })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-modal", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ========================================================
   * bootstrap-tab.js v2.2.1
   * http://twitter.github.com/bootstrap/javascript.html#tabs
   * ========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ======================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* TAB CLASS DEFINITION
    * ==================== */
  
    var Tab = function (element) {
      this.element = $(element)
    }
  
    Tab.prototype = {
  
      constructor: Tab
  
    , show: function () {
        var $this = this.element
          , $ul = $this.closest('ul:not(.dropdown-menu)')
          , selector = $this.attr('data-target')
          , previous
          , $target
          , e
  
        if (!selector) {
          selector = $this.attr('href')
          selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
  
        if ( $this.parent('li').hasClass('active') ) return
  
        previous = $ul.find('.active:last a')[0]
  
        e = $.Event('show', {
          relatedTarget: previous
        })
  
        $this.trigger(e)
  
        if (false) return
  
        $target = $(selector)
  
        this.activate($this.parent('li'), $ul)
        this.activate($target, $target.parent(), function () {
          $this.trigger({
            type: 'shown'
          , relatedTarget: previous
          })
        })
      }
  
    , activate: function ( element, container, callback) {
        var $active = container.find('> .active')
          , transition = callback
              && $.support.transition
              && $active.hasClass('fade')
  
        function next() {
          $active
            .removeClass('active')
            .find('> .dropdown-menu > .active')
            .removeClass('active')
  
          element.addClass('active')
  
          if (transition) {
            element[0].offsetWidth // reflow for transition
            element.addClass('in')
          } else {
            element.removeClass('fade')
          }
  
          if ( element.parent('.dropdown-menu') ) {
            element.closest('li.dropdown').addClass('active')
          }
  
          callback && callback()
        }
  
        transition ?
          $active.one($.support.transition.end, next) :
          next()
  
        $active.removeClass('in')
      }
    }
  
  
   /* TAB PLUGIN DEFINITION
    * ===================== */
  
    $.fn.tab = function ( option ) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('tab')
        if (!data) $this.data('tab', (data = new Tab(this)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.tab.Constructor = Tab
  
  
   /* TAB DATA-API
    * ============ */
  
    $(document).on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-tab", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  !function(name, context, definition) {
  	if (typeof module !== 'undefined') module.exports = definition(ender);
  	else if (typeof define === 'function' && typeof define.amd === 'object') define(ender);
  	else context[name] = definition(ender);
  }('diaglit', this, function($) {
  	return function(dialog, options) {
  
  		var _ = require('underscore'),
  			controls = require('diaglit.controls'),
  			_diaglit = {},
  			li = _.template('\
  				<li>\
  					<a href="<%= href %>" data-toggle="tab"><%= label %></a>\
  				</li>\
  			') //li template definition
  		if (_.isFunction(options)) {
  			options = {
  				'onSubmit': options
  			}
  		}
  		options = _.defaults(options || {}, {
  			appendTo: 'body',
  			'data': {}
  		})
  
  		//dialog skeleton
  		_diaglit.$dialog = $(_.template('\
  			<div id="<%= id %>" title="<%= title %>" class="modal">\
  				<div class="modal-header">\
  		            <a href="#" class="close">x</a>\
  		            <h3><%= title %></h3>\
  		        </div>\
  		        <div class="modal-body">\
  		        	<ul class="nav nav-tabs"></ul>\
  		        	<form class="tab-content form-horizontal"></form>\
  	        	</div>\
  	        	<div class="modal-footer">\
  		            <a href="#" class="btn secondary cancel">Cancel</a>\
  		            <a href="#" class="btn primary save">Save</a>\
  		         </div>\
  			</div>\
  		', {
  			id: _.uniqueId('dialog_' + dialog.title.replace(' ', '')),
  			title: dialog.title,
  		})).hide().appendTo(options.appendTo).modal({
  			backdrop: true
  		})
  
  		//tabs and fieldset appending
  		_(dialog.tabs).map(function(v, k) {
  			//iterate through tabs and generate <li> and <fieldset>
  			var tabId = _.uniqueId(k)
  			return [
  			$(li({
  				href: '#' + tabId,
  				label: v.label || k
  			})), _.reduce(v.fields, function($fieldset, field) {
  				//generate fields and append to field
  				return $fieldset.append(controls.field(field, options['data']))
  			}, $('<fieldset>').attr({
  				'id': tabId,
  				'class': 'tab-pane'
  			}))]
  		}).reduce(function(memo, tab) { // [(li,fieldset),(li,fieldset),...]
  			$(memo[0]).append(tab[0]); //ul += li
  			$(memo[1]).append(tab[1]); //form += fieldset
  			return memo
  		}, _diaglit.$dialog.find('ul,form')); //memo
  
  		(function(d) {
  			d.find('li:nth-child(1),fieldset:nth-child(1)').addClass('active')
  			d.find('.btn.cancel').bind('click', function(e) {
  				e.stop()
  				d.modal('hide')
  			})
  			if (options['onSubmit']) {
  				d.find('.btn.save').bind('click', options['onSubmit'])
  				if (options['hideOnSubmit']) {
  					d.modal('close')
  				}
  			}
  		})(_diaglit.$dialog);
  
  		return _diaglit;
  	}
  });

  provide("diaglit", module.exports);

}());