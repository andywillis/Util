!function (global) {
  'use strict';

  /**
   * Store locator module
   * @param  {object} Venda Venda namespace
   * @param  {object} $     jQuery
   */
  function defineModule(Venda, $) {

    var applicationData, StoreLocator;

    /**
     * Configuration
     */
    applicationData = {
      app: {
        imagePath: 'images',
        //imagePath: '/content/ebiz/shop/resources/images/storelocator/',
        appPrefix: 'stloc-',
        maxCount: 20,
        delay: 3000,
        sortByLookup: {
          nonGoogleDistance: 'distance.km',
          distance: 'googleOrigin.distance.value',
          duration: 'googleOrigin.duration.value',
          price: 'price'
        },
        largeDeviceSmoothScroll: true,
        scrollSpeed: 40,
        localStorageProperties: {
          routeData: true,
          storeData: true,
          formattedDirections: true
        },
        iconList: [
          'stloc-back',
          'stloc-deliverymethod_bybox', 'stloc-deliverymethod_collectplus',
          'stloc-deliverymethod_merchant', 'stloc-deliverymethod_temp',
          'stloc-info', 'stloc-list', 'stloc-locatoroptions', 'stloc-map',
          'stloc-sort', 'stloc-route', 'stloc-view', 'spinner'
        ],
        endpoint: {
          bybox: 'http://37.58.67.19/sl/stable/backend/bybox',
          collectplus: 'http://37.58.67.19/sl/stable/backend/bybox',
          infinity: 'http://37.58.67.19/sl/stable/backend/bybox',
          merchant: 'http://37.58.67.19/sl/dev/backend/internal',
          temp: 'http://37.58.67.19/sl/stable/backend/bybox'
        },
        nodes: {
          adddeliverymethodbutton: '.stloc-selectdeliverytype',
          addresslabel: '.stloc-addresslabel',
          addresslabelmain: '.stloc-addresslabelmain',
          addresslabelremove: '.selectDeliveryType, .view, .route, .stloc-heading',
          alert: '.stloc-alert',
          app: '#js-storelocator',
          blocker: '.blocker',
          confirmstorebutton: '.stloc-hiddensubmit',
          constructor: '.stloc-constructor',
          definitiongroups: '.stloc-definition-group',
          deliverymethods: '.stloc-deliverymethods',
          deliverypopupwrapper: '.stloc-deliverymethods.popup',
          downarrow: '.stloc-downarrow',
          error: '.stloc-error',
          filterview: '.stloc-filterview',
          form: '.stloc-hiddeninputs',
          info: '.stloc-info',
          infoblock: '.stloc-infoblock',
          infobutton: '.stloc-viewtype.info',
          infotable: '.stloc-info-table',
          inline: '.inline',
          layer: '.stloc-layer',
          list: '.stloc-list',
          listsorter: '.listsorter',
          main: '.stloc-main',
          map: '.stloc-map',
          mapicon: '.stloc-viewtype.map',
          moneyicon: '.icon-money',
          nogoogleiconremove: '.route, .view',
          optionsbutton: '.stloc-options',
          optionsdescription: '.stloc-optionsdescription',
          optionspopupmobile: '.stloc-optionspopupmobile',
          optionspopup: '.stloc-optionspopup',
          scrollbar: '.stloc-scrollbar',
          search: '.stloc-search',
          sort: '.stloc-sort',
          sortmethods: '.stloc-sortmethods',
          template: '.stloc-template',
          uparrow: '.stloc-uparrow',
          viewtypeicon: '.stloc-viewtype',
          viewtypes: '.stloc-viewtypes',
        }
      }
    };

    StoreLocator = {

      name: 'StoreLocator',

      getNodes: function () {
        return this.nodes;
      },

      init: function (applicationData) {
        $.extend(this, applicationData.app);
        this.optionsPopupVisible = false;
        this
          .setApplicationNode()
          .setDevice()
          .checkLocalStorage()
          .loadTemplates(this.loadApp.bind(this));
        return this;
      },

      checkLocalStorage: function () {
        this.hasLocalStorage = util.HTMLSupport.localStorage;
        return this;
      },

      setDevice: function () {
        this.device = util.checkDevice();
        return this;
      },

      setApplicationNode: function () {
        this.applicationNode = $(this.nodes.app);
        return this;
      },

      // Slightly more efficient way of grabbing DOM nodes using jQuery by
      // specifying the context in which they can be found; in this case our
      // application node `#js-storelocator`.
      getNode: function (element) {
        return this.applicationNode.find(this.nodes[element]);
      },

      loadApp: function () {
        this
        //.checkApiService();
          .getUserDefinedParams()
          .checkDeliveryMethods()
          .getDefinitions()
          .checkGoogle()
          .setImageInfo()
          .createImageCache()
          .clearLocalStorage()
          .addApplicationScaffold()
          .addSortMethodIcons()
          .updateIconsOnType()
          .setPostcodeInput()
          .setSearchBoxFocus()
          .initDataWrangler()
          .createBlocker();

        if (this.placesAPI) {
          this.addPlacesSearch();
        }

        if (this.hasGoogle) {
          this.initMap();
        }

        return this;
      },

      updateIconsOnType: function () {
        if (this.storelocatorType === 'normal') {
          $('.listsorter[data-type="price"]').remove();
        }
        if (this.storelocatorType === 'checkout') {
          this
          .addDeliveryMethodIcons();
        }
        return this;
      },

      removePriceInformation: function () {
        $('.stloc-price').remove();
        return this;
      },

      setPostcodeInput: function () {
        var postcode;
        if (!this.placesAPI && this.hasLocalStorage && this.getLocalStorage('postcode')) {
          postcode = this.getLocalStorage('postcode');
          this.getNode('search').val(postcode);
        }
        return this;
      },

      // Multilanguage definitions are held in the HTML
      // (so they can be updated by the Venda app)
      // under the `stloc-definition-group` class. They are added to this
      // application using the the appropriate `type`.
      // e.g. this.message.infinity, this.error.postcode.
      // After processing they are removed from the HTML.
      getDefinitions: function () {
        var _this;
        _this = this;
        this.getNode('definitiongroups').each(function () {
          var type, $this;
          $this = $(this);
          type = $this.data('type');
          _this[type] = {};
          $this.find('dt').each(function () {
            var $this = $(this);
            _this[type][$this.text()] = $this.next().text();
          });
        }).remove();
        return this;
      },

      processTemplateData: function (tmpl) {
        return tmpl
          .replace(/>\s+</gim, '><')
          .replace(/\s{2,}/gim, '');
      },

      loadTemplates: function (loadApp) {
        var _this;
        _this = this;
        this.templates = {};
        this.getNode('template').each(function () {
          var name, html;
          name = $(this).data('name');
          html = $(this).html();
          _this.templates[name] = _this.processTemplateData(html);
        }).remove();
        loadApp();
      },

      // A basic test to see if the Store locator service is available.
      // Not vigourously tested yet.
      checkApiService: function () {
        $.ajax({
          url: 'testapi',
          type: 'HEAD',
          contentType: 'html'
        }).done(function (data) {
          console.log(data);
        }).fail(function (err) {
          console.log(err);
        });
        return this;
      },

      checkGoogle: function () {
        this.hasGoogle = typeof google === 'object' && typeof google.maps === 'object';
        return this;
      },

      setImageInfo: function () {
        var imageType = 'png';
        this.imagePath = this.imagePath + '/' + imageType + '/';
        this.imageExtension = '.' + imageType;
        return this;
      },

      setOptionsDescription: function () {
        var $desc, html;
        $desc = this.getNode('optionsdescription');
        html = this.deliveryMethods
          .sort()
          .join(' & ') + ', sorted by ' + this.sortBy;
        $desc.html(html.toUpperCase());
        return this;
      },

      getUserDefinedParams: function () {
        var $main, defaults;
        $main = this.getNode('constructor');
        defaults = $main.data();
        this.storelocatorType = defaults.type || 'normal';
        this.merchant = defaults.merchant;

        // This needs to be updated when the merchant data starts working
        // properly.
        if (this.storelocatorType === 'checkout') {
          this.deliveryMethods = defaults.deliverymethods
            ? defaults.deliverymethods.split(/,\s*/g)
            : ['temp'];
        } else {
          this.deliveryMethods = ['temp'];
        }
        this.viewType = defaults.viewtype || 'list';
        this.count = defaults.count <= 10 ? defaults.count : this.maxCount;
        this.placesAPI = defaults.placesapi ? true : false;
        this.svg = defaults.svg ? true : false;
        return this;
      },

      checkDeliveryMethods: function () {
        for (var i = 0, l = this.deliveryMethods.length; i < l; i++) {
          if (!this.endpoint[this.deliveryMethods[i]]) {
            this.deliveryMethods.splice(i, 1);
          }
        }
        this.log('info', 'Non-standard delivery method found and removed.');
        return this;
      },

      log: function (type, message) {
        console[type](message);
        return this;
      },

      addPlacesSearch: function () {
        this.searchBox = new google.maps.places.SearchBox(this.getNode('search')[0]);
        this.addGoogleEvent(this.searchBox, 'places_changed', this.processPlace);
        return this;
      },

      togglePopup: function (el) {
        var $el, top, left, $popup, $wrapper;
        $popup = this.getNode('optionspopup');
        if (this.optionsPopupVisible) {
          $popup.hide();
        } else {
          $el = $(el);
          $el.top = $el.offset().top;
          $el.left = $el.offset().left;
          $el.height = $el.height();
          $el.width = $el.width();
          if (this.storelocatorType === 'checkout') {
            top = $el.top - $el.height - 17;
          } else {
            top = $el.top - $el.height + 12;
          }
          left = $el.left  + $el.width + 23;
          $popup.show().offset({ top: top, left: left });
          $wrapper = this.getNode('deliverypopupwrapper');
          $popup.height($wrapper.height());
          $popup.width($wrapper.width());
        }
        this.optionsPopupVisible = !this.optionsPopupVisible;
        return this;
      },

      setSearchBoxFocus: function () {
        this.getNode('search').focus();
        return this;
      },

      getScaffoldObj: function () {
        return {
          path: this.imagePath,
          imageExtension: this.imageExtension,
          iconsize: this.getIconSize()
        };
      },

      addApplicationScaffold: function () {
        var html, obj, template;
        template = this.templates.main;
        obj = this.getScaffoldObj();
        html = util.applyTemplate(template, obj);
        this.getNode('constructor').append(html);
        this.getNode('inline').hide();
        if (this.storelocatorType !== 'checkout') {
          this.getNode('moneyicon').hide();
        }
        this.positionMap();
        return this;
      },

      // This can be removed with refactoring. Originally we had two
      // icon sizes to differentiate between mobile and desktop, but now this
      // is not the case. The CSS would also need to be updated, as well as
      // some of the HTML template descriptions.
      getIconSize: function () {
        return 'stloc-icon-small';
        //return ['mobile', 'tablet'].contains(this.device) ? 'stloc-icon-small' : 'stloc-icon-large';
      },

      getDeliveryMethodIconObj: function (deliveryMethod) {
        return {
          path: this.imagePath,
          type: deliveryMethod,
          imageExtension: this.imageExtension,
          iconsize: this.getIconSize()
        };
      },

      addSortMethodIcons: function () {
        var template;
        template = this.templates.sort;
        this.getNode('sortmethods').append(template);
        this.getNode('deliverypopupwrapper').prepend(template);
        return this;
      },

      addDeliveryMethodIcons: function () {
        var template, $deliveryMethods, html, obj, deliveryMethod, i, l;
        template = this.templates.deliverymethodicon;
        $deliveryMethods = this.getNode('deliverymethods');
        for (i = this.deliveryMethods.length - 1, l = 0; i >= l; i--) {
          deliveryMethod = this.deliveryMethods[i];
          if (deliveryMethod === 'merchant' && !this.deliveryMethods.contains('merchant')) { continue; }
          obj = this.getDeliveryMethodIconObj(deliveryMethod);
          html = util.applyTemplate(template, obj);
          $deliveryMethods.prepend(html);
        }
        return this;
      },

      addPostcodeToLocalStorage: function (postcode) {
        if (this.hasLocalStorage) {
          this.setLocalStorage({ postcode: postcode });
        }
        return this;
      },

      createImageCache: function () {
        for (var i = 0, l = this.iconList.length; i < l; i++) {
          new Image().src = this.imagePath + this.iconList[i] + this.imageExtension;
        }
        return this;
      },

      viewStoreOnMap: function (number) {
        this
          .setOldViewType('map')
          .setViewType('map')
          .toggleView()
          .zoomToMarker(number);
        return this;
      },

      viewRouteOnMap: function (number) {
        this
          .setOldViewType('map')
          .getRoute(number, true)
          .setViewType('map')
          .toggleView();
        return this;
      },

      processDeliveryMethod: function (store) {
        var number = $(store).data('number');
        this
          .setSelectedStore(number)
          .clearLocalStorage()
          .hideAddressLabel()
          .clearForm()
          .updateFormFields(number)
          .createAddressLabel(number);
        if (this.hasGoogle) {
          this
            .getRoute(number, false)
            .formatDirections();
        }
        return this;
      },

      updateInfoLayer: function (number, type) {
        var html, $info;
        $info = this.getNode('info');
        this.highlightItemInList(number);
        html = this.createStoreInfo(number);
        $info.html(html);
        if (this.storelocatorType === 'normal') {
          this.getNode('adddeliverymethodbutton').hide();
          this.removePriceInformation();
        }
        this
          .setOldViewType(type)
          .setViewType('info')
          .toggleView();
        if (!this.hasGoogle) { this.getNode('nogoogleiconremove').hide(); }
        return this;
      },

      setOldViewType: function (type) {
        this.oldViewType = type;
        return this;
      },

      clearForm: function () {
        this.getNode('form').find('input.stloc-edit').val('');
        return this;
      },

      disableIcon: function (type) {
        this.getNode(type)
          .removeClass('stloc-show')
          .addClass('stloc-hide');
        return this;
      },

      enableIcon: function (type) {
        this.getNode(type).removeClass('stloc-hide').addClass('stloc-show');
        return this;
      },

      updateFormFields: function (number) {
        var $form, address, store;
        store = this.data[number];
        address = store.address;
        $form = this.getNode('form');
        $form.find('.stloc-edit[name=num]').val(store.store_id);
        $form.find('.stloc-edit[name=addr1]').val(address.address1);
        $form.find('.stloc-edit[name=addr2]').val(address.address2);
        $form.find('.stloc-edit[name=city]').val(address.town);
        $form.find('.stloc-edit[name=state]').val(address.region);
        $form.find('.stloc-edit[name=zipc]').val(address.postcode);
        $form.find('.stloc-edit[name=phone]').val('0');
        $form.find('.stloc-edit[name=cntry]').val('United Kingdom');
        return this;
      },

      createAddressObject: function (number) {
        var store, address;
        store = this.data[number];
        address = store.address;
        return {
          id: store.store_id,
          add1: address.address1,
          add2: address.address2,
          town: address.town,
          region: address.region,
          postcode: address.postcode,
          country: 'United Kingdom'
        };
      },

      createAddressLabel: function (number) {
        var html, obj, template;
        template = this.templates.addresslabel;
        obj = this.createAddressObject(number);
        html = util.applyTemplate(template, obj);
        this.getNode('infotable').replaceWith(html);
        this.addNameSection().addConfirmStoreButton();
        this.getNode('addresslabelremove').remove();
        return this;
      },

      addConfirmStoreButton: function () {
        var $confirmButton;
        $confirmButton = this.getNode('confirmstorebutton').clone();
        $confirmButton.insertBefore(this.getNode('addresslabelmain').children(':last-child'));
        $confirmButton.css({ display: 'block' });
        return this;
      },

      addNameSection: function () {
        var child;
        child = this.getNode('addresslabelmain').find('div:first-child');
        $(this.templates.addressnamesection)
          .css({ display: 'block' })
          .insertBefore(child);
        return this;
      },

      hideAddressLabel: function () {
        this.getNode('addresslabel').css({display: 'none'});
        return this;
      },

      processIconChange: function (icon) {
        if ($(icon).hasClass('stloc-deliverymethod')) {
          this.toggleDeliveryMethodIcons(icon);
        }
        return this;
      },

      // Not yet used. Awaiting fixed pricing to be introduced (into the VCP?)
      // before this will work.
      getPrice: function (type) {
        return this.price[type];
      },

      formatName: function (name) {
        return name.replace(/^BB\d+\w+/, '').replace(/(.\(?[A-Z0-9]+\)?)$/g, '');
      },

      createListObj: function (el) {
        return {
          path: this.imagePath,
          name: this.formatName(el.address.name),
          icon: el.icon,
          no: el.number,
          address1: el.address.address1,
          address2: el.address.address2,
          km: el.distdur.distance,
          mi: this.convertToKmToMiles(el.distdur.distance),
          time: el.distdur.duration,
          description: el.extra.location_description,
          iconsize: this.getIconSize(),
          price: el.price
        };
      },

      getMobileIconPath: function (type) {
        return this.imagePath + '#{type}_clean_icon#{imageExtension}'
            .replace('#{type}', type)
            .replace('#{imageExtension}', this.imageExtension);
      },

      getIconPath: function (i, type) {
        return this.imagePath + '#{type}_#{no}#{imageExtension}'
            .replace('#{type}', type)
            .replace('#{no}', i)
            .replace('#{imageExtension}', this.imageExtension);
      },

      getDistanceAndDuration: function (el) {
        var distance, duration;
        if (this.hasGoogle && el.googleOrigin.status !== 'ZERO_RESULTS') {
          distance = (el.googleOrigin.distance.value / 1000).toFixed(2);
          duration = el.googleOrigin.duration.text;
        } else {
          distance = el.distance.km.toFixed(2);
          duration = 'unknown';
        }
        return { distance: distance, duration: duration };
      },

      updateListLayer: function () {
        var html, template, obj, _this;
        html = '';
        _this = this;
        template = this.device === 'mobile'
          ? this.templates.liststoreinfomobile
          : this.templates.liststoreinfo;
        this.data.forEach(function (el, i) {
          el.number = i + 1;
          el.icon = _this.device === 'mobile'
            ? _this.getMobileIconPath(el.storeType)
            : _this.getIconPath(el.storeNumber, el.storeType);
          el.distdur = _this.getDistanceAndDuration(el);
          obj = _this.createListObj(el);
          html += util.applyTemplate(template, obj);
        });
        this.getNode('list').html(html);
        if (this.storelocatorType === 'normal') {
          this.removePriceInformation();
        }
        return this;
      },

      // Used to check later on in the checkout whether the (by)box address stored
      // in localstorage when the customer chose a store is still available.
      // This is the only method that is currently available in this
      // application's API.
      getSingleBybox: function () {
        var lat, lon, params, storeData;
        if (this.hasLocalStorage && this.getLocalStorage('storeData')) {
          storeData = JSON.parse(this.getLocalStorage('storeData'));
          lat = String(storeData.location.lat).substring(0, 6);
          lon = String(storeData.location.lon).substring(0, 6);
          params = { type: 'bybox', count: 1, use_filters: 1, lat: lat, lon: lon };
          this
            .getInfinityData(this.endpoint.bybox, params)
            .then(this.isByboxAvailable.bind(this, storeData));
        }
        return this;
      },

      isByboxAvailable: function (storeData, data) {
        var alert, name;
        name = storeData.address.name;
        if (data.stores[0] && data.stores[0].store_id === storeData.store_id) {
          alert = this.message.byboxAvailable.replace('#{loc}', name);
          this
            .showAlertBar(alert, 'message', true)
            .hideAlertBar(3000);
        } else {
          alert = this.message.byboxUnavailable.replace('#{loc}', name);
          this
            .showAlertBar(alert, 'error', true)
            .hideAlertBar(3000);
        }
        return this;
      },

      setViewType: function (type) {
        this.viewType = type;
        return this;
      },

      toggleViewIcons: function () {
        if (this.viewType === 'info') {
          this.enableIcon('infobutton');
        }
        this.getNode('viewtypeicon').removeClass('on');
        $('.stloc-viewtype.' + this.viewType).addClass('on');
        return this;
      },
    
      resetApp: function () {
        this
          .showFilterOptions()
          .showMain()
          .disableIcon('infobutton')
          .setViewType('list')
          .getNode('list').scrollTop(0);
        return this;
      },

      toggleDeliveryMethodIcons: function (el) {
        var $el, type;
        $el = $(el);
        type = $el.data('type');
        if ($el.hasClass('on')) {
          if (this.deliveryMethods.length > 1) {
            $el.removeClass('on').addClass('off');
            this.updateDeliveryMethodArray(type, 'off');
          }
        } else {
          $el.addClass('on').removeClass('off');
          this.updateDeliveryMethodArray(type, 'on');
        }
        if (this.viewType === 'info') {
          this.setViewType('list')
              .toggleView({reset: true});
        }
        this.disableIcon('infobutton');
        this.getCachedData();
        return this;
      },

      updateContent: function () {
        this
          .showFilterOptions()
          .hideAlertBar()
          .updateListLayer()
          .toggleSortByShading()
          .setOptionsDescription()
          .showMain()
          .showViewType()
          .toggleView();
        return this;
      },

      getCachedData: function () {
        var stores, i, l;
        this.data = [];
        for (i = 0, l = this.deliveryMethods.length; i < l; i++) {
          stores = this.tempData[this.deliveryMethods[i]].stores;
          this.data.push.apply(this.data, stores);
        }
        this
          .updateSortIcons(this.sortBy)
          .sortStores(this.sortBy)
          .sliceData(this.count)
          .updateListAndMapLayers();
        return this;
      },

      updateSortIcons: function (type) {
        this.getNode('listsorter').removeClass('on');
        $('.listsorter[data-type="' + type + '"]').addClass('on');
        return this;
      },

      updateListAndMapLayers: function () {
        this.updateContent();
        if (this.hasGoogle) { this.updateMap(); }
        return this;
      },

      sliceData: function (limit) {
        this.data = this.data.slice(0, limit);
        return this;
      },

      toggleSortByShading: function () {
        $('.stloc-' + this.sortBy).addClass('shade');
        return this;
      },

      toggleScrollButtons: function () {
        var $scrollbar = this.getNode('scrollbar');
        $scrollbar.show();
        this.toggleScrollbarHighlight();
        return this;
      },

      toggleView: function (params) {
        this
          .toggleViewIcons()
          .toggleScrollButtons();
        if (params && params.reset) { this.resetApp(); }
        this.getNode('layer').css({ 'z-index': 0 });
        if (!this.hasGoogle) {
          this.getNode('mapicon').hide();
        } else {
          if (this.viewType === 'map') { this.clearRoutes(); }
        }
        if (params && params.zoomToMarkers) { this.zoomToMarkers(); }
        $('.stloc-' + this.viewType).css({ 'z-index': 1, width: '100%' });
        return this;
      },

      positionMap: function () {
        this.getNode('map').css({
          height: '453px',
          width: '100%',
          position: 'absolute'
        });
        return this;
      },

      scrollListContent: function (direction) {
        var pos, $wrapper, speed;
        $wrapper = this.getNode(this.viewType);
        pos = $wrapper.scrollTop();
        speed = this.scrollSpeed;
        $wrapper.scrollTop(direction === 'up' ? pos - speed : pos + speed);
        this.toggleScrollbarHighlight($wrapper, pos);
        return this;
      },

      toggleScrollbarHighlight: function () {
        var $wrapper, pos, scrollHeight, height, $up, $down;
        $wrapper = this.getNode(this.viewType);
        pos = $wrapper.scrollTop();
        $up = this.getNode('uparrow');
        $down = this.getNode('downarrow');
        scrollHeight = $wrapper[0].scrollHeight;
        height = $wrapper.outerHeight();
        if (pos < scrollHeight - height) { $down.addClass('active'); }
        if (pos > 0) { $up.addClass('active'); }
        if (pos <= 0) { $up.removeClass('active'); this.scrollStop(); }
        if (pos >= scrollHeight - height) {
          $down.removeClass('active');
          this.scrollStop();
        }
        return this;
      },

      scrollStart: function (direction) {
        var _this = this;
        if (['mobile', 'tablet'].contains(this.device) || !this.largeDeviceSmoothScroll) {
          this.scrollListContent(direction);
        } else {
          (function scroller() {
            _this.scrollListContent(direction);
            _this.scrollInterval = setTimeout(scroller, 100);
          }());
        }
        return this;
      },

      scrollStop: function () {
        if (this.largeDeviceSmoothScroll) {
          clearTimeout(this.scrollInterval);
        }
        return this;
      },

      showFilterOptions: function () {
        var $filter = this.getNode('filterview');
        if ($filter.css('display') === 'none') {
          $filter.css({display: 'block', height: '67px'});
          if (this.storelocatorType !== 'checkout') {
            $filter.find('.stloc-deliverymethod').hide();
          }
        }
        return this;
      },

      showMain: function () {
        this.getNode('main').css({display: 'block', height: '455px'});
        return this;
      },

      createInstructionObject: function (step, index) {
        return {
          step: index + 1,
          instructions: step.instructions,
          distance: step.distance.text,
          duration: step.duration.text
        };
      },

      formatDirections: function () {
        var instructions, html, steps, mainTpl, lineTpl, o, routeData, i, l;
        if (this.hasLocalStorage && this.getLocalStorage('routeData')) {
          routeData = JSON.parse(this.getLocalStorage('routeData'));
          steps = routeData.routes[0].legs[0].steps;
          mainTpl = this.templates.instruction;
          lineTpl = this.templates.instructionline;
          instructions = '';
          for (i = 0, l = steps.length; i < l; i++) {
            o = this.createInstructionObject(steps[i], i);
            instructions += util.applyTemplate(lineTpl, o);
          }
          html = util.applyTemplate(mainTpl, { instructions: instructions });
          this.setLocalStorage({ formattedDirections: html });
        }
        return this;
      },

      // For `getLocalStorage` and `setLocalStorage` we need to set up a
      // try...catch condition because Safari or IOS dies when it's on
      // private browsing mode.
      getLocalStorage: function (key) {
        try {
          return localStorage.getItem(this.appPrefix + key);
        } catch (e) {
          console.log('Local storage error - check private browsing mode');
        }
      },

      setLocalStorage: function (data) {
        var item, key;
        try {
          for (key in data) {
            if (data.hasOwnProperty(key)) {
              item = data[key];
              if (typeof item === 'object') { item = JSON.stringify(item); }
              localStorage.setItem(this.appPrefix + key, item);
            }
          }
        } catch (e) {
          console.log('Local storage error - check private browsing mode');
        }
        return this;
      },

      setSelectedStore: function (number) {
        this.selectedStore = number;
        return this;
      },

      clearLocalStorage: function () {
        var k, properties;
        properties = this.localStorageProperties;
        if (this.hasLocalStorage) {
          for (k in properties) {
            if (properties[k]) {
              localStorage.removeItem(this.appPrefix + k);
            }
          }
        }
        return this;
      },

      getFormattedAddress: function (store) {
        return this.templates.address
          .replace('#{name}', store.address.name)
          .replace('#{address1}', store.address.address1)
          .replace('#{address2}', store.address.address2)
          .replace('#{town}', store.address.town)
          .replace('#{postcode}', store.address.postcode)
          .replace('#{region}', store.address.region);
      },

      createStoreinfoObj: function (number) {
        var store, icon, distanceAndDuration;
        number--;
        store = this.data[number];
        icon = this.getIconPath(store.storeNumber, store.storeType);
        distanceAndDuration = this.getDistanceAndDuration(store);
        return {
          path: this.imagePath,
          address: this.getFormattedAddress(store),
          icon: icon,
          imageExtension: this.imageExtension,
          km: distanceAndDuration.distance,
          mi: this.convertToKmToMiles(distanceAndDuration.distance),
          town: store.address.town,
          description: store.extra.location_description,
          time: distanceAndDuration.duration,
          no: number,
          iconsize: this.getIconSize(),
          price: store.price
        };
      },

      convertToKmToMiles: function (km) {
        return (km * 0.62137).toFixed(2);
      },

      createStoreInfo: function (number) {
        var template, obj;
        template = this.templates.storeinfo;
        obj = this.createStoreinfoObj(number);
        return util.applyTemplate(template, obj);
      },

      showViewType: function () {
        this.getNode('viewtypes')
          .css({ display: 'block' })
          .animate({ opacity: 1 }, 500);
        return this;
      },

      updateDeliveryMethodArray: function (type, state) {
        var index;
        switch (state) {
        case 'on':
          this.deliveryMethods.push(type);
          break;
        case 'off':
          index = this.deliveryMethods.indexOf(type);
          this.deliveryMethods.splice(index, 1);
          break;
        }
        return this;
      },

      showAlertBar: function (msg, type) {
        this.hideAlertBar();
        type = this.appPrefix + type;
        this
          .getNode('alert')
          .addClass(type)
          .html('<img class="spinner" src="' + this.imagePath + '/spinner.png"/>' + msg.toUpperCase())
          .css({ display: 'block' });
        return this;
      },

      hideAlertBarFn: function () {
        this
          .getNode('alert')
          .hide()
          .removeClass('stloc-message')
          .removeClass('stloc-error')
          .html('');
        return this;
      },

      hideAlertBar: function (delay) {
        if (delay) {
          setTimeout(this.hideAlertBarFn.bind(this), 3000);
        } else {
          this.hideAlertBarFn();
        }
        return this;
      },

      clearStoreInfo: function () {
        this.getNode('info').empty();
        return this;
      },

      highlightItemInList: function (number) {
        var $item, height;
        $item = $('.stloc-infoblock:nth-child(' + number + ')');
        height = $item.outerHeight();
        this.getNode('infoblock').removeClass('highlight');
        $item.addClass('highlight');
        this.getNode('list').scrollTop(height * (number - 1));
        return this;
      },


      /**
       * Map
       */
      initMap: function () {
        this.mapOptions = this.getMapOptions();
        this.markers = [];
        this.searchVisible = false;
        this
          .setOrigin(this.mapOptions.origin)
          .createMarkerImageArray(this.loadMarkerImages)
          .createMap()
          .centerMap()
          .initServices();
        return this;
      },

      getMapOptions: function () {
        return {
          origin: [51.509946, -0.126944],
          searchAutoShow: true,
          zoom: 15,
          scrollwheel: true,
          mapTypeControl: false,
          streetViewControl: false,
          overviewMapControl: true,
          zoomControl: true,
          panControl: false,
          scaleControl: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT
          },
          directionsRendererOptions: {
            polylineOptions: {
              strokeColor: 'rgb(255, 0, 0)',
              strokeOpacity: 0.4,
              strokeWeight: 8
            }
          }
        };
      },

      setOrigin: function (latLngArr) {
        this.origin = this.getLatLng(latLngArr);
        return this;
      },

      initServices: function () {
        this
          .initDirectionsService()
          .initGeocoder()
          .checkHasGeolocation();
        return this;
      },

      createMap: function () {
        this.map = new google.maps.Map(this.getNode('map')[0], this.mapOptions);
        return this;
      },

      checkHasGeolocation: function () {
        this.hasGeolocation = window.navigator.geolocation ? true: false;
        return this;
      },

      addGoogleEvent: function (el, event, fn) {
        google.maps.event.addListener(el, event, fn.bind(this));
        return this;
      },

      getGeoLocation: function () {
        var geo;
        if (this.hasGeolocation) {
          this.setViewType('list')
              .toggleView({reset: true})
              .showAlertBar(this.message.geo, 'message');
          geo = window.navigator.geolocation;
          this.setLayerBlocking();
          geo.getCurrentPosition(this.processGeoResponse.bind(this), this.showGeoError.bind(this));
        }
        return this;
      },

      showGeoError: function () {
        this
          .showAlertBar(this.error.nav, 'error', true)
          .hideAlertBar(3000);
        return this;
      },

      processGeoResponse: function (position) {
        var coords, lat, lng;
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        coords = [lat, lng];
        this.origin = this.getLatLng(coords);
        this.getData({ lat: lat, lon: lng });
        return this;
      },

      geocodePostcode: function (location, callback) {
        this.geocoder.geocode(location, function (data) {
          if (data.length > 0) {
            callback({
              lat: data[0].geometry.location.lat(),
              lng: data[0].geometry.location.lng()
            });
          }
        });
      },

      getRoute: function (store, doPlotRoute) {
        var currentStore;
        currentStore = this.data[store];
        this.directionsService.route({
          origin: this.origin,
          destination: currentStore.location.latLng,
          travelMode: google.maps.TravelMode.DRIVING
        }, this.processRoute.bind(this, currentStore, doPlotRoute));
        return this;
      },

      processRoute: function (storeData, doPlotRoute, routeData) {
        this.setLocalStorage({
          routeData: routeData,
          storeData: storeData
        });
        if (doPlotRoute) { this.plotRoute(routeData); }
      },

      plotRoute: function (res) {
        this.directionsDisplay.setMap(this.map);
        this.directionsDisplay.setDirections(res);
        return this;
      },

      updateMap: function () {
        this
          .resize()
          .deleteMarkers()
          .setStoreMarkers()
          .setHomeMarker()
          .zoomToMarkers();
        return this;
      },

      centerZoom: function (origin, zoom) {
        this.map.setCenter(origin);
        this.map.setZoom(zoom);
        return this;
      },

      zoomToMarker: function (pos) {
        var lat, lng, marker;
        marker = this.markers[pos];
        lat = marker.position.lat();
        lng = marker.position.lng();
        this.centerZoom(new google.maps.LatLng(lat, lng), 15);
        return this;
      },

      zoom: function (zoom) {
        this.map.setZoom(zoom);
        return this;
      },

      clearMarkers: function () {
        for (var i = 0, l = this.markers.length; i < l; i++) {
          this.markers[i].setMap(null);
        }
        return this;
      },

      deleteMarkers: function () {
        this.clearMarkers(null);
        this.markers = [];
        return this;
      },

      centerMap: function () {
        this.map.setCenter(this.origin);
        this.zoom(15);
        return this;
      },

      initGeocoder: function () {
        this.geocoder = new google.maps.Geocoder();
        return this;
      },

      clearRoutes: function () {
        this.directionsDisplay.setMap(null);
        return this;
      },

      initDirectionsService: function () {
        var renderOptions = this.mapOptions.directionsRendererOptions;
        this.directionsService = new google.maps.DirectionsService();
        this.directionsMatrix = new google.maps.DistanceMatrixService();
        this.directionsDisplay = new google.maps.DirectionsRenderer(renderOptions);
        this.directionsDisplay.setOptions({ suppressMarkers: true });
        this.directionsDisplay.setMap(this.map);
        return this;
      },

      getLatLng: function (array) {
        return new google.maps.LatLng(array[0], array[1]);
      },

      resize: function () {
        google.maps.event.trigger(this.map, 'resize');
        return this;
      },

      loadMarkerImages: function (arr) {
        var image, i, l;
        for (i = 0, l = arr.length; i < l; i++) {
          if (arr[i] !== undefined) {
            image = new Image();
            image.src = arr[i];
          }
        }
        return this;
      },

      // This loads in only the number of images per marker that the client
      // has specified in the HTML parameters (or 20) so that bandwidth
      // is not wasted.
      createMarkerImageArray: function (loadMarkerImages) {
        var i, l, arr, filename, _this;
        _this = this;
        arr = [];
        arr.push(this.imagePath + 'stloc-home' + this.imageExtension);
        this.deliveryMethods.forEach(function (el) {
          for (i = 1, l = _this.count; i <= l; i++) {
            filename = el + '_' + i + _this.imageExtension;
            arr.push(_this.imagePath + filename);
          }
        });
        loadMarkerImages(arr);
        return this;
      },

      setHomeMarker: function () {
        this.markers.push(this.defineMarker('home', this.origin));
        return this;
      },

      getImagePrototype: function (type) {
        if (type === 'home') {
          return {
            size: new google.maps.Size(32, 42),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 42),
            scaledSize: new google.maps.Size(32, 42)
          };
        } else {
          return {
            size: new google.maps.Size(55, 42),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 42),
            scaledSize: new google.maps.Size(55, 42)
          };
        }
      },

      getMarkerImage: function (type, store) {
        var filename, image, path;
        path = this.imagePath + '#{filename}';
        switch (type) {
          case 'home':
            filename = 'stloc-home' + this.imageExtension;
            image = this.getImagePrototype('home');
            break;
          default:
            filename = store.storeType + '_#{no}#{imageExtension}'
              .replace('#{no}', store.storeNumber)
              .replace('#{imageExtension}', this.imageExtension);
            image = this.getImagePrototype('store');
            break;
        }
        image.url = path.replace('#{filename}', filename);
        return image;
      },

      defineMarker: function (type, position, number, store) {
        var marker;
        marker = new google.maps.Marker({
          draggable: false,
          raiseOnDrag: false,
          icon: this.getMarkerImage(type, store),
          animation: google.maps.Animation.DROP,
          position: position,
          map: this.map
        });
        this.addGoogleEvent(marker, 'click', this.updateInfoLayer.bind(this, number, 'map'));
        return marker;
      },

      setStoreMarkers: function () {
        var store, lat, lng, position, iconNumber, i, l;
        for (i = 0, l = this.data.length; i < l; i++) {
          store = this.data[i];
          lat = store.location.lat;
          lng = store.location.lon;
          iconNumber = i + 1;
          position = this.getLatLng([lat, lng]);
          this.markers.push(this.defineMarker('store', position, iconNumber, store));
        }
        return this;
      },

      zoomToMarkers: function () {
        var marker, lat, lng, position, latLngList, bounds, i, l;
        latLngList = [];
        for (i = 0, l = this.markers.length; i < l; i++) {
          marker = this.markers[i];
          lat = marker.position.lat();
          lng = marker.position.lng();
          position = this.getLatLng([lat, lng]);
          latLngList.push(position);
        }
        bounds = new google.maps.LatLngBounds();
        for (i = 0, l = latLngList.length; i < l; i++) {
          bounds.extend(latLngList[i]);
        }
        this.map.fitBounds(bounds);
        return this;
      },

      /**
       * Data Wrangler
       */

      // Still no a perfect regex for UK postcodes. I don't think one exists.
      // It doesn't, for example, catch `NW33 3PF`, so the error routine
      // `checkDataForErrors` is used to alert the customter to any problems if
      // the service doesn't return any results.
      regex: {
        postcode: new RegExp([
          '^((GIR 0AA)|([A-PR-UW-Z]{1}[A-IK-Y]?)',
          '([0-9]?[A-HJKS-UW]?[ABEHMNPRVWXY]?|[0-9]?[0-9]?))',
          '\\s?([0-9]{1}[ABD-HJLNP-UW-Z]{2})$'
        ].join(''))
      },

      initDataWrangler: function () {
        this.tempData = {};
        this.data = [];
        this.destinations = [];
        return this;
      },

      // Google Places is a separate function to `processPostcode` as
      // 1) it need to to be worked on differently due to the way that
      // the interface handles user input.
      processPlace: function () {
        var places, location, address;
        places = this.searchBox.getPlaces();
        if (places && places.length) {
          location = places[0].geometry.location;
          address = places[0].formatted_address;
          this.setOrigin([location.lat(), location.lng()]);
          this.location = { lat: location.lat(), lon: location.lng() };
          this.setLayerBlocking();
          this.getData(this.location);
        } else {
          this.showAlertBar(this.error.places, 'error', true);
        }
        return this;
      },

      processPostcode: function (postcode) {
        var validPostcode, _this;
        _this = this;
        validPostcode = this.isValidPostcode(postcode);
        if (validPostcode[0]) {
          this.addPostcodeToLocalStorage(validPostcode[1]);
          if (this.hasGoogle) {
            this.geocodePostcode({ address: postcode }, function (data) {
              _this.setOrigin([data.lat, data.lng]);
            });
          }
          this.location = { postcode: validPostcode[1] };
          this.setLayerBlocking();
          this.getData(this.location);
        } else {
          this
            .showAlertBar(validPostcode[1], 'error', true)
            .hideAlertBar(3000);
        }
        return this;
      },

      // Could do with a bit of work.
      isValidPostcode: function (search) {
        var postcode, validPostcode;
        postcode = search.replace(/\s/gi, '');
        validPostcode = this.regex.postcode.test(postcode);
        if (!validPostcode) { return [false, this.error.postcode]; }
        return [true, this.amendPostcodeForInfinity(postcode)];
      },

      sortStores: function (type) {
        util.sortArrayOfObjects(this.sortByLookup[type], this.data);
        if (type === 'nonGoogleDistance') {
          this.sortBy = 'distance';
        } else {
          this.sortBy = type;
        }
        this.renumberStores();
        return this;
      },

      createBlocker: function () {
        var $blocker = $('<div class="blocker"></div>');
        this.applicationNode.append($blocker);
        this.blocker = this.getNode('blocker');
        return this;
      },

      setLayerBlocking: function () {
        var $el;
        $el = this.applicationNode;
        this.blocker.css({
          top: $el.css('top'),
          left: $el.css('left'),
          width: $el.outerWidth(),
          height: $el.outerHeight()
        }).show();
        return this;
      },

      setLayerUnblocking: function () {
        this.getNode('blocker').hide();
        return this;
      },

      renumberStores: function () {
        this.data.forEach(function (el, i) {
          el.storeNumber = i + 1;
        });
        return this;
      },

      // The service has a problem if there isn't an appropriate space in the
      // submitted postcode, so this adds one in.
      amendPostcodeForInfinity: function (postcode) {
        var temp, foundSpace, len;
        temp = postcode.split('');
        foundSpace = temp.indexOf(' ');
        len = temp.length;
        if (len === 6 && foundSpace < 0) { temp.splice(3, 0, ' '); }
        if (len === 7 && foundSpace < 0) { temp.splice(4, 0, ' '); }
        return temp.join('');
      },

      getInfinityData: function (type, endpoint, params) {
        var _this = this;
        return $.ajax({
          type: 'GET',
          url: endpoint,
          data: params,
          dataType: 'jsonp'
        }).done(function (data) {
          data.type = type;
          _this.tempData[type] = data;
        });
      },

      // Temporary method used to fake pricing and temporary data coordinates
      // so that I could check that the service JSONP promises were working
      // as expected. Once refactored the check for storeType should remain
      // or be moved to its own method.
      fixData: function (data) {
        data.stores.forEach(function (el) {
          el.price = parseInt((Math.random() * (20 - 1) + 1).toFixed(0), 10);
          switch (data.type) {
            case 'bybox':
              el.storeType = 'bybox';
              break;
            case 'collectplus':
              el.storeType = 'collectplus';
              el.location.lat += 0.035;
              el.location.lon += 0.035;
              break;
            case 'temp':
              el.storeType = 'temp';
              el.location.lat += 0.075;
              el.location.lon += 0.075;
              break;
            default:
              el.storeType = 'merchant';
              break;
          }
        });
        return data;
      },

      compileDataPromises: function (params) {
        var promises, i, l, endpoint, promise, type;
        promises = [];
        for (i = 0,  l = this.deliveryMethods.length; i < l; i++) {
          type = this.deliveryMethods[i];
          endpoint = this.endpoint[type];
          promise = this.getInfinityData(type, endpoint, params);
          promises.push(promise);
        }
        return promises;
      },

      getData: function (params, callback) {
        var defaultParams, promises;
        this
          .resetDataStore()
          .showAlertBar(this.message.infinity, 'message');
  
        // The sl service has a limit of 20 returned results, so we'll
        // just hard-code this into the application to prevent any errors.
        defaultParams = { count: 20, use_filters: 1 };
        params = util.merge(defaultParams, params);
        promises = this.compileDataPromises(params);

        // Just a really great way to deal with promises. Load them all into
        // an array and then pass that to $.when using `apply`.
        $.when.apply(null, promises).then(this.processData.bind(this, callback));
        return this;
      },

      checkDataForErrors: function () {
        var k, count, keys, result;
        count = 0;
        keys = Object.keys(this.tempData);
        for (k in this.tempData) {
          if (this.tempData[k].errors.length) { count++; }
        }
        result = count - keys.length;
        if (result === 0) {
          return { error: true, message: this.error.allservice };
        }
        if (result < 0 && count !== 0) {
          return { error: true, message: this.error.service };
        }
        return { error: false };
      },

      showDataError: function (errorStatus) {
        this
          .showAlertBar(errorStatus.message, 'error')
          .hideAlertBar(3000);
        return this;
      },

      processData: function () {
        var tempData, promises, k, errorStatus;
        errorStatus = this.checkDataForErrors();
        if (errorStatus.error) {
          this.showDataError(errorStatus);
        } else {

          // If Google is available we can use the directionsMatrix API
          // to get standardised/accurate distance/duration data
          // rather than rely on the metrics from each self-service provider.
          // The process uses jQuery's promise API to reduce callback spaghetti.
          if (this.hasGoogle) {
            promises = [];
            for (k in this.tempData) {
              tempData = this.tempData[k];
              tempData = this.fixData(tempData);
              tempData = this.addStoreLatLng(tempData);
              promises.push(this.calculateTravelTime(tempData));
            }
            $.when.apply(null, promises).then(this.updateMainData.bind(this));
          } else {
            for (k in this.tempData) {
              tempData = this.tempData[k];
              tempData = this.fixData(tempData);
            }
            this.updateMainData();
          }
          this.setLayerUnblocking();
        }
        return this;
      },

      updateMainData: function () {
        for (var k in this.tempData) {
          this.data.push.apply(this.data, this.tempData[k].stores);
        }
        if (this.hasGoogle) {
          this.sortStores('distance');
        } else {
          this.sortStores('nonGoogleDistance');
        }
        this
          .sliceData(this.count)
          .toggleView({reset: true})
          .updateListAndMapLayers()
          .fireEvent('stloc-dataloaded');
        return this;
      },

      fireEvent: function (type) {
        var event = new CustomEvent(type, {
          'detail': function () {
            return 'Data loaded.';
          }
        });
        window.dispatchEvent(event);
        return this;
      },

      // Since google doesn't return promises on its own, we need to set a
      // deferred object manually.
      calculateTravelTime: function (data) {
        var origin, options, deferred, _this;
        _this = this;
        deferred = new $.Deferred();
        origin = this.origin;

        options = {
          origins: [origin],

          // The directionsMatrix service has a MAX LIMIT of 25 destinations.
          // This application has a limit of 20 destinations just to be on the
          // safe side.
          destinations: data.destinations.slice(0, this.maxCount),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        };

        this.directionsMatrix.getDistanceMatrix(options, function (response) {
          data = _this.mergeDestinationsIntoStoreData(data, response);
          deferred.resolve();
        });

        return deferred.promise();
      },

      mergeDestinationsIntoStoreData: function (data, response) {
        var matches, i, l;
        matches = response.rows[0].elements;
        for (i = 0, l = matches.length; i < l; i ++) {
          data.stores[i].googleOrigin = matches[i];
        }
        this.tempData[data.type] = data;
        return this;
      },

      addStoreLatLng: function (data) {
        var store, lat, lng, i, l;
        data.destinations = [];
        for (i = 0, l = data.stores.length; i < l; i++) {
          store = data.stores[i];
          lat = store.location.lat;
          lng = store.location.lon;
          store.location.latLng = this.getLatLng([lat, lng]);
          data.destinations.push(store.location.latLng);
        }
        return data;
      },

      resetDataStore: function () {
        this.data = [];
        this.tempData = {};
        this.destinations = [];
        this.clearStoreInfo();
        return this;
      }

    };

    /**
     * UI
     */
    $(function () {

      var touchStartPos, distance, userClick;

      StoreLocator.init(applicationData);

      userClick = false;

      //util.checker('scripts/storeLocator2-11.js', [StoreLocator]);

      $(window).resize(function () {
        if (StoreLocator.viewType === 'map') { StoreLocator.resize(); }
        if (StoreLocator.markers && StoreLocator.markers.length > 0) {
          StoreLocator.zoomToMarkers();
        }
      });

      // Allow swipe on list
      $('.stloc-list')
        .bind('touchstart', function () {
          touchStartPos = $(window).scrollTop();
        })
        .bind('touchend', function () {
          distance = touchStartPos - $(window).scrollTop();
          if (distance > 5 || distance < -5) {
            userClick = false;
          } else {
            userClick = true;
          }
        });

      // Input controls
      $('.stloc-search').on('keypress', function (e) {
        if (e.keyCode === 13) {
          e.preventDefault();
        }
      });

      $('.stloc-search').on('keypress', function (e) {
        var postcode;
        if (!StoreLocator.placesAPI && e.keyCode === 13) {
          e.preventDefault();
          postcode = $(this).val().toUpperCase();
          if (StoreLocator.getNode('infobutton').css('display') !== 'none') {
            StoreLocator.setViewType('list');
          }
          StoreLocator
            .toggleView({reset: true})
            .processPostcode(postcode);
        }
      });

      $('.stloc-searchbutton').on('click', function (e) {
        e.preventDefault();
        var postcode;
        postcode = StoreLocator.getNode('search').val();
        if (StoreLocator.getNode('infobutton').css('display') !== 'none') {
          StoreLocator.setViewType('list');
        }
        if (StoreLocator.placesAPI) {
          StoreLocator.processPlace();
        } else {
          StoreLocator.processPostcode(postcode.toUpperCase());
        }
      });

      // INFO
      $('.stloc-info')

        .on('click', '.listlink', function (e) {
          e.preventDefault();
          StoreLocator
            .setViewType('list')
            .toggleView({reset: true});
        })

        .on('click', '.stloc-icon.view', function (e) {
          e.preventDefault();
          var number = $(this).data('number');
          StoreLocator.viewStoreOnMap(number);
        })

        .on('click', '.stloc-icon.route', function (e) {
          e.preventDefault();
          var number = $(this).data('number');
          StoreLocator.viewRouteOnMap(number);
        })

        .on('click', '.stloc-selectdeliverytype', function (e) {
          e.stopPropagation();
          StoreLocator.processDeliveryMethod(this);
        })

        .on('click', '.back', function (e) {
          e.preventDefault();
          var type, params;
          type = StoreLocator.oldViewType;
          params = type === 'map' ? {zoomToMarkers: true} : {};
          StoreLocator
            .setViewType(type)
            .toggleView(params);
        });

      // FILTERVIEW
      $('.stloc-filterview').on('click', '.stloc-options', function (e) {
        e.preventDefault();
        StoreLocator.togglePopup(this);
      });

      // MAIN
      $('.stloc-main').on('click', '.stloc-icon', function (e) {
        e.preventDefault();
        StoreLocator.processIconChange(this);
      });

      // POPUP
      $('.stloc-optionspopup')

        .on('click', '.listsorter', function (e) {
          e.preventDefault();
          var type = $(this).data('type');
          StoreLocator
            .updateSortIcons(type)
            .sortStores(type)
            .updateListAndMapLayers();
        })

        .on('click', '.stloc-deliverymethods-footer', function (e) {
          if (StoreLocator.optionsPopupVisible) {
            if (!$(e.target).hasClass('stloc-options')) {
              StoreLocator.togglePopup(this);
            }
          }
        });

      $('.stloc-viewtype').on('click', function () {
        var type, params, $this, infoOk;
        $this = $(this);
        type = $this.data('type');
        infoOk = false;
        if (type === 'info' && $this.hasClass('stloc-show')) { infoOk = true; }
        if (['map', 'list'].contains(type) || (type === 'info' && infoOk)) {
          params = type === 'map' ? {zoomToMarkers: true} : {};
          StoreLocator
            .setViewType(type)
            .toggleView(params);
        }
      });

      $('.stloc-list').on('touchstart click', '.stloc-infoblock', function () {
        var number;
        if (['mobile', 'tablet'].contains(StoreLocator.device)) {
          if (userClick) {
            number = $(this).data('number');
            StoreLocator.updateInfoLayer(number, 'list');
          }
        } else {
          number = $(this).data('number');
          StoreLocator.updateInfoLayer(number, 'list');
        }
        userClick = false;
      });

      $('.findme').on('click', function () { StoreLocator.getGeoLocation(); });

      $('.stloc-uparrow').on('mousedown', function () {
        if ($(this).hasClass('active')) {
          StoreLocator.scrollStart('up');
        }
      });
      
      $('.stloc-downarrow').on('mousedown', function () {
        if ($(this).hasClass('active')) {
          StoreLocator.scrollStart('down');
        }
      });

      $('.stloc-downarrow, .stloc-uparrow').on('mouseup', function () { StoreLocator.scrollStop(); });

    });


    return {
      getNodes: StoreLocator.getNodes.bind(StoreLocator),
      checkBybox: StoreLocator.getSingleBybox.bind(StoreLocator)
    };

  }

  global.Venda = global.Venda || {};
  global.Venda.StoreLocator = defineModule(
    global.Venda,
    global.jQuery
  );

}(this);