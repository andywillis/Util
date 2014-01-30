/*global console, Modernizr, ActiveXObject, unescape: true */
/*jshint bitwise: true */
/*jshint browser: true */
/*jshint camelcase: false */
/*jshint curly: true */
/*jshint eqeqeq: true */
/*jshint expr: true */
/*jshint immed: false */
/*jshint indent: 2 */
/*jshint latedef: true */
/*jshint laxbreak: true */
/*jshint noarg: true */
/*jshint plusplus: false */
/*jshint quotmark: single */
/*jshint undef: true */
/*jshint unused: true */
/*jshint trailing: true */

!function (global) {
  'use strict';

  function defineModule(Venda, $) {

    /**
     * Custom event polyfill
     * @return {[type]} [description]
     */
    (function () {
      function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
      }
      CustomEvent.prototype = window.CustomEvent.prototype;
      window.CustomEvent = CustomEvent;
    })();

    /**
     * Add ECMA262-5 method binding if not supported natively
     * http://stackoverflow.com/questions/2790001/fixing-javascript-array-functions-in-internet-explorer-indexof-foreach-etc
     */
    if (!('bind' in Function.prototype)) {
      Function.prototype.bind = function(owner) {
        var that = this, args;
        if (arguments.length <= 1) {
          return function() {
            return that.apply(owner, arguments);
          };
        } else {
          args= Array.prototype.slice.call(arguments, 1);
          return function() {
            return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
          };
        }
      };
    }

    /**
     * Add ECMA262-5 string trim if not supported natively.
     */
    if (!('trim' in String.prototype)) {
      String.prototype.trim = function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
      };
    }

    /**
     * Add ECMA262-5 Array methods if not supported natively
     */
    if (!('indexOf' in Array.prototype)) {
      Array.prototype.indexOf = function(find, i /*opt*/) {
        var n;
        if (i === undefined) { i = 0; }
        if (i < 0) { i += this.length; }
        if (i < 0) { i = 0; }
        for (n = this.length; i < n; i++) {
          if (i in this && this[i]===find) { return i; }
        }
        return -1;
      };
    }

    if (!('lastIndexOf' in Array.prototype)) {
      Array.prototype.lastIndexOf = function(find, i /*opt*/) {
        if (i === undefined) { i = this.length - 1; }
        if (i < 0) { i += this.length; }
        if (i > this.length-1) { i = this.length - 1; }
        for (i++; i --> 0;) {
          if (i in this && this[i] === find) { return i; }
        }
        return -1;
      };
    }

    if (!('forEach' in Array.prototype)) {
      Array.prototype.forEach = function(action, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++) {
          if (i in this) { action.call(that, this[i], i, this); }
        }
      };
    }

    if (!('map' in Array.prototype)) {
      Array.prototype.map = function(mapper, that /*opt*/) {
        var other = new Array(this.length);
        for (var i = 0, n = this.length; i < n; i++) {
          if (i in this) { other[i] = mapper.call(that, this[i], i, this); }
        }
        return other;
      };
    }

    if (!('filter' in Array.prototype)) {
      Array.prototype.filter = function(filter, that /*opt*/) {
        var other = [], v;
        for (var i = 0, n = this.length; i < n; i++) {
          if (i in this && filter.call(that, v = this[i], i, this)) { other.push(v); }
        }
        return other;
      };
    }

    if (!('every' in Array.prototype)) {
      Array.prototype.every = function(tester, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++) {
          if (i in this && !tester.call(that, this[i], i, this)) { return false; }
        }
        return true;
      };
    }

    if (!('some' in Array.prototype)) {
      Array.prototype.some = function(tester, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++) {
          if (i in this && tester.call(that, this[i], i, this)) { return true; }
        }
        return false;
      };
    }

    if (!('contains' in Array.prototype)) {
      Array.prototype.contains = function(v) {
        for (var i = 0, n = this.length; i < n; i++) {
          if (this[i] === v) { return true; }
        }
        return false;
      };
    }

    /** START UTIL **/

    var util = {};

    /**
     * Allows an the nested property of an object
     * to be referenced by a string.
     * @param  {Object} o Object
     * @param  {String} s String name of nested property
     * @return {String}   Property value.
     */
    Object.byString = function(o, s) {
      var a, n;
      s = s.replace(/\[(\w+)\]/g, '.$1');
      s = s.replace(/^\./, '');
      a = s.split('.');
      while (a.length) {
        n = a.shift();
        if (n in o) {
          o = o[n];
        } else {
          return;
        }
      }
      return o;
    };

    /**
     * Sort an array of objects using a property string.
     * See also Object.byString in util.
     * @param  {String} prop  String containing the property path to be sorted on.
     * @param  {Array} arr    Array of objects for sorting.
     * @return {Array}        Sorted array
     */
    util.sortArrayOfObjects = function (prop, arr) {
      arr.sort(function (a, b) {
        var arrOne, arrTwo;
        arrOne = Object.byString(a, prop);
        arrTwo = Object.byString(b, prop);
        if (arrOne < arrTwo) {
          return -1;
        } else if (arrOne > arrTwo) {
          return 1;
        } else {
          return 0;
        }
      });
      return arr;
    };

    /**
     * Returns the current device.
     * @return {String} Device.
     */
    util.checkDevice = function () {
      var obj, prop;
      obj = {
        'only all and (max-width: 767px)': 'Mobile',
        'only all and (max-width: 997px)': 'Tablet',
        'only all and (max-width: 1259px)': 'Standard',
        'only all and (min-width: 1260px)': 'Large'
      };
      for (prop in obj) {
        if (Modernizr.mq(prop)) { return obj[prop].toLowerCase(); }
      }
    };

    util.checker = function (url, arrayOfObjects) {
      var obj, out, type, regex, arr, outarr;
      obj = this.listFunctions(arrayOfObjects);
      out = {};
      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'html',
        success: function (data) {
          for (var k in obj) {
            type = obj[k];
            for (var i = 0, l = type.length; i < l; i++) {
              regex = new RegExp(type[i] + '(\\(|\\.)', 'gim');
              out[type[i]] = 0;
              while ((arr = regex.exec(data)) !== null) {
                out[type[i]]++;
              }
            }
          }
          outarr = [];
          for (k in out) {
            if (out[k] === 0) { outarr.push(k); }
          }
          console.log(outarr);
        }
      });
    };

    util.listFunctions = function (array) {
      var funcArray = {};
      for (var i = 0, l = array.length; i < l; i++) {
        var obj = array[i];
        funcArray[obj.name] = [];
        for (var k in obj) {
          if (typeof obj[k] === 'function') {
            funcArray[obj.name].push(k);
          }
        }
      }
      return funcArray;
    };

    /**
     * Simple function to provide replace all functionality that works
     * with variables.
     * @param  {String} find    String to find.
     * @param  {String} replace String that replaces the find string.
     * @param  {String} str     The string on which to operate.
     * @return {String}         Processed string.
     */
    util.replaceAll = function(find, replace, str) {
      return str.replace(new RegExp(find, 'g'), replace);
    };

    /**
     * Applies a template to a data object to produce HTML. The template can be
     * either a a flat HTML structure, or a JS array.
     * @param  {Array}  template  HTML Template.
     * @param  {Object} obj       Data object.
     * @return {String}           HTML.
     */
    util.applyTemplate = function(template, obj) {
      var p, prop, param, html;
      html = util.toType(template) === 'array' ? template.join('') : template;
      for (p in obj) {
        if (obj.hasOwnProperty(p)) {
          prop = obj[p];
          param = '#{param}'.replace('param', p);
          html = util.replaceAll(param, prop, html);
        }
      }
      return html;
    };

     /**
     * Object that stores storage support values.
     * @type {Object}
     */
    util.HTMLSupport = {
      localStorage: (typeof window !== 'undefined' && 'localStorage' in window !== null) ? true : false,
      sessionStorage: (typeof window !== 'undefined' && 'sessionStorage' in window !== null) ? true : false,
      file: (typeof window !== 'undefined' && 'File' in window !== null) ? true : false
    };

    /**
     * Returns an array of object keys.
     * If using underscore or lodash this can be replaced with _.size.
     * @param  {Object} obj Object
     * @return {Array}      Array
     */
    util.keys = function(obj) {
      var arr = [], prop;
      if (Object.keys) { return Object.keys(obj); }
      if (util.toType(obj) === 'object') {
        for (prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            arr.push(prop);
          }
        }
      }
      return arr;
    };

    /**
     * Creates an object with supplied default properties
     * @param  {Arr} propsArr Array of properties
     * @return {Object}       Object
     */
    util.initPropsAsArrays = function(propsArr) {
      var obj, el, prop;
      obj = {};
      for (el in propsArr) {
        if (propsArr.hasOwnProperty(el)) {
          prop = propsArr[el];
          obj[prop] = [];
        }
      }
      return obj;
    };

    /**
     * Takes an object and array of properties and resets those object properties.
     * @param  {Object} obj Object.
     * @param  {Array} arr  Array of properties to be reset.
     * @return {Object}     Updated object.
     */
    util.objToDefault = function(arr, value) {
      var index, len, prop, obj;
      obj = {};
      for (index = 0, len = arr.length; index < len; index++) {
        prop = arr[index];
        if (obj[prop] === undefined || obj[prop] === null) {
          obj[prop] = value;
        }
      }
      return obj;
    };

    /**
     * compileAssets returns a LABjs object containing arrays of scripts to be loaded.
     * @param  {Object}   options  Script root URL, current pageUID, assets object, an array of LABjs object properties.
     * @param  {Function} callback Function called after LABjs object is created.
     */
    util.compileAssets = function(options, callback) {
      var script, path, asset, type, appliesTo, applies, labObj;
      labObj = util.initPropsAsArrays(options.labObjProps);
      for (script in options.assets) {
        if (options.assets.hasOwnProperty(script)) {
          asset = options.assets[script];
          type = asset.type;
          appliesTo = asset.appliesTo;
          applies = (appliesTo[0] === 'all' || appliesTo.contains(options.page)) ? true : false;
          if (applies) {
            path = options.root + asset.location + '/' + script;
            labObj[type].push(path);
          }
        }
      }
      callback(labObj);
    };

    /**
     * Builds a new namespace thru iteration when provided with a namespace string.
     * @param  {string}  A period-separated namespace (e.g. Recipe.Meat.Lamb).
     * @return {object}  A namespace object.
     */

    util.namespace = function (namespaceString) {
      var i, len, parts, parent, currentPart;
      parts = namespaceString.split('.');
      parent = window;
      currentPart = '';
      for (i = 0, len = parts.length; i < len; i++) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
      }
      return parent;
    };

    /**
     * Returns a DOM object from supplied ID.
     */
    util.get = function (id) {
      return document.getElementById(id);
    };

    /**
     * Improved typeof function.
     * @param  {x}       The structure to be assessed.
     * @return {string}  The identifier.
     */
    util.toType = function(x) { return ({}).toString.call(x).match(/\s([a-zA-Z]+)/)[1].toLowerCase(); };

    /**
     * Object properties that are null are reset to emptyString.
     * @param  {object} obj Object to be checked.
     * @return {object}     Reformatted object.
     */
    util.resetNullProperties = function(obj) {
      var prop;
      for (prop in obj) {
        if (obj.hasOwnProperty(prop) && (obj[prop] === null || obj[prop] === undefined)) {
          obj[prop] = '';
        }
      }
      return obj;
    };

    /**
     * Merge two objects.
     * @param  {Object} a Object A.
     * @param  {Object} b Object B.
     * @return {Object}   Returned merged object.
     */
    util.merge = function(a, b) {
      var key;
      if (a && b) {
        for (key in b) {
          if (b.hasOwnProperty(key)) {
            a[key] = b[key];
          }
        }
      }
      return a;
    };

    /**
     * Non-jQuery ajax routine.
     * @param  {string}   url      URL.
     * @param  {function} callback Function to run on XMLHTTPrequest ok.
     * @param  {string}   postData Form data.
     */
    util.ajax = function (url, callback, postData) {
      var req, method;
      req = createXMLHTTPObject();
      if (!req) { return; }
      method = (postData) ? 'POST' : 'GET';
      req.open(method,url,true);
      req.onreadystatechange = function () {
        if (req.readyState !== 4) { return; }
        if (req.status !== 200 && req.status !== 304) {
          return;
        }
        callback(req);
      };
      if (req.readyState === 4) { return; }
      req.send(postData);
    };

    var XMLHttpFactories = [
      function () {return new XMLHttpRequest();},
      function () {return new ActiveXObject('Msxml2.XMLHTTP');},
      function () {return new ActiveXObject('Msxml3.XMLHTTP');},
      function () {return new ActiveXObject('Microsoft.XMLHTTP');}
    ];

    function createXMLHTTPObject() {
      var i, l, xmlhttp = false;
      for (i = 0, l = XMLHttpFactories.length; i < l; i++) {
        try {
          xmlhttp = XMLHttpFactories[i]();
        }
        catch (e) {
          continue;
        }
        break;
      }
      return xmlhttp;
    }

    /**
     * Checks whether the browser/device can process touch events.
     * @return {Boolean} True/False.
     */
    util.isTouchDevice = function() {
      if ('ontouchstart' in document.documentElement) { return true; }
      else { return false; }
    };

    /**
     * Returns an array. Most commonly used to convert nodelists to arrays for processing.
     * @param  {Array} x Item to be processed.
     * @return {Array}   Array.
     */
    util.toArray = function(x) {
      return Array.prototype.slice.call(x, 0);
    };

    /**
     * Converts a URL to an object with each parameter defined as a property.
     * @param  {String} url URL
     * @return {Object}     Object of URL parameters.
     */
    util.uritoobj = function(url){
      var obj = {},
          qloc = url.indexOf('?'),
          str = url.substring(qloc + 1),
          spl = str.split('&'),
          i, el, len;

      for (i = 0, len = spl.length; i < len; i++) {
        el = spl[i].split('=');
        obj[el[0]] = el[1];
      }

      return obj;
    };

    /**
     * Returns a specific URL parameter, or false.
     * @param  {String} url         URL.
     * @param  {[type]} param       Parameter.
     * @return {String or Boolean}  Value of parameter, or false.
     */
    util.getUrlParam = function(url, param) {
      var re = new RegExp('[?&]' + param + '=([^&]+)'), match = url.match(re);
      return match ? unescape(match[1]) : false;
    };

    /**
     * Checks to see if an element exists.
     * Abstracted version of $(element).length > 0
     * @return {[type]} [description]
     */
    $.fn.exists = function() {
      return this.length > 0;
    };

  }

  global.Util = defineModule();

}(this);