Ext.namespace('CB');

CB.ObjectCardView = Ext.extend(Ext.Panel, {
      border: false
      ,layout: 'card'
      ,activeItem: 0
      ,hideBorders: true
      ,tbarCssClass: 'x-panel-white'
      ,autoScroll: true
      ,initComponent: function() {
            this.actions = {
                  edit: new Ext.Action({
                      iconCls: 'icon-edit'
                      ,disabled: true
                      ,scope: this
                      ,handler: this.onEditClick
                  })
                  ,reload: new Ext.Action({
                      iconCls: 'icon-reload'
                      ,scope: this
                      ,handler: this.onReloadClick
                  })

                  ,save: new Ext.Action({
                      iconCls: 'icon-save'
                      ,text: L.Save
                      ,hidden: true
                      ,scope: this
                      ,handler: this.onSaveClick
                  })
                  ,cancel: new Ext.Action({
                      iconCls: 'icon-cancel'
                      ,text: Ext.MessageBox.buttonText.cancel
                      ,hidden: true
                      ,scope: this
                      ,handler: this.onCancelClick
                  })
                  ,openInTabsheet: new Ext.Action({
                      iconCls: 'icon-external'
                      ,hidden: true
                      ,scope: this
                      ,handler: this.onOpenInTabsheetClick
                  })

                  // ,pin: new Ext.Action({
                  //     iconCls: 'icon-pin'
                  //     ,scope: this
                  //     ,handler: this.onPinClick
                  // })

            };

            Ext.apply(this, {
                  tbar: [
                        this.actions.edit
                        ,this.actions.reload
                        ,this.actions.save
                        ,this.actions.cancel
                        ,'->'
                        ,this.actions.openInTabsheet
                        // ,this.actions.pin
                  ]
                  ,items: [{
                              title: L.Preview
                              ,iconCls: 'icon-preview'
                              ,header: false
                              ,xtype: 'CBObjectPreview'
                        },{
                              title: L.Edit
                              ,iconCls: 'icon-edit'
                              ,header: false
                              ,xtype: 'CBEditObject'
                              ,listeners: {
                                    scope: this
                                    ,change: function(){
                                          this.actions.save.setDisabled(false);
                                    }
                                    ,clear: function(){
                                          this.actions.save.setDisabled(true);
                                    }
                              }
                        },{
                              title: L.Properties
                              ,iconCls: 'icon-infoView'
                              ,header: false
                              ,xtype: 'CBObjectProperties'
                        }
                  ]
                  ,listeners: {
                        scope: this
                        ,add: this.onCardItemAdd
                  }
            });

            CB.ObjectCardView.superclass.initComponent.apply(this, arguments);

            this.delayedLoadTask = new Ext.util.DelayedTask(this.doLoad, this);

      }
      ,getButton: function() {
            if(!this.button) {
                  this.button = new Ext.SplitButton({
                        iconCls: 'icon32-app-view'
                        ,scale: 'large'
                        ,iconAlign:'top'
                        ,enableToggle: true
                        ,scope: this
                        ,toggleHandler: this.onButtonToggle
                        ,menu: []
                  });
            }
            return this.button;
      }
      ,onButtonToggle: function(b, e){
            if(b.pressed){
                  this.show();
                  this.load(this.loadedId);
            }else{
                  this.hide();
            }
      }
      ,onCardItemAdd: function(container, component, index){
            if(container !== this) {
                  return;
            }
            var b = this.getButton();
            b.menu.add({
                  text: component.title
                  ,iconCls: component.iconCls
                  ,scope: this
                  ,handler: this.onViewChangeClick
            });
      }
      ,onViewChangeClick: function(buttonOrIndex, autoLoad){
            var currentItemIndex = this.items.indexOf(this.getLayout().activeItem);
            var mb = this.getButton();
            var idx = Ext.isNumber(buttonOrIndex)
                  ? buttonOrIndex
                  : mb.menu.items.indexOf(buttonOrIndex);
            if(currentItemIndex == idx) {
                  return;
            }

            this.getLayout().setActiveItem(idx);
            if(!mb.pressed) {
                  mb.toggle();
            }
            this.onViewChange(idx);
            if(autoLoad !== false) {
                  this.load(this.requestedLoadId);
            }
      }
      ,onViewChange: function(index) {
            var activeItem = this.getLayout().activeItem;
            var tb = this.getTopToolbar();
            switch(activeItem.getXType()) {
                  case 'CBObjectPreview':
                        tb.setVisible(true);
                        this.actions.edit.show();
                        this.actions.reload.show();
                        this.actions.save.hide();
                        this.actions.cancel.hide();
                        // this.actions.openInTabsheet.hide();
                        // this.actions.pin.hide();
                        //this.load(this.loadedId);
                  break;
                  case 'CBEditObject':
                        tb.setVisible(true);
                        this.actions.edit.hide();
                        this.actions.reload.hide();
                        this.actions.save.show();
                        this.actions.cancel.show();
                        this.actions.openInTabsheet.show();
                        // this.actions.pin.hide();
                  break;
                  case 'CBObjectProperties':
                        tb.setVisible(true);
                        this.actions.edit.show();
                        this.actions.reload.show();
                        this.actions.save.hide();
                        this.actions.cancel.hide();
                        this.actions.openInTabsheet.hide();
                        // this.actions.pin.hide();
                  break;
                  default:
                        tb.setVisible(false);

            }

      }

      ,load: function(objectId) {
            this.delayedLoadTask.cancel();
            this.requestedLoadId = objectId;
            if(this.getLayout().activeItem.getXType() !== 'CBEditObject') {
                  this.delayedLoadTask.delay(300, this.doLoad, this);
            }
      }
      ,doLoad: function() {
            this.loadedId = this.requestedLoadId;
            var activeItem = this.getLayout().activeItem;
            switch(activeItem.getXType()) {
                  case 'CBObjectPreview':
                        activeItem.loadPreview(this.requestedLoadId);
                        break;
                  case 'CBEditObject':
                        activeItem.load(this.requestedLoadId);
                        break;
                  case 'CBEditObject':
                        // activeItem.loadPreview(this.requestedLoadId);
                        break;
            }
            this.actions.edit.enable();
      }
      ,edit: function (objectData) {
            this.onViewChangeClick(1, false);
            this.getLayout().activeItem.load(objectData);
            this.loadedId = objectData.id;
            // this.requestedLoadId = objectData.id;
      }
      ,onEditClick: function() {
            this.onViewChangeClick(1);
            // this.actions.save.setDisabled(true);
            this.getLayout().activeItem.load(this.loadedId);
      }
      ,onReloadClick: function() {
            this.getLayout().activeItem.reload();
      }

      ,onSaveClick: function() {
            this.getLayout().activeItem.save(
                  function(component){
                        component.clear();
                        this.onViewChangeClick(0);
                        this.getLayout().activeItem.loadPreview(this.loadedId);
                  }
                  ,this
            );
      }
      ,onCancelClick: function() {
            this.getLayout().activeItem.clear();
            this.onViewChangeClick(0);
      }
      ,onOpenInTabsheetClick: function(b, e) {
            App.mainViewPort.openObject(
                  this.getLayout().activeItem.data
                  ,e
            );
            this.getLayout().activeItem.clear();
            this.onViewChangeClick(0);
      }

}
);

Ext.reg('CBObjectCardView', CB.ObjectCardView);
