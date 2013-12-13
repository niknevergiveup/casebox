Ext.namespace('CB.form.edit');

CB.form.edit.Object = Ext.extend(Ext.Panel, {
    xtype: 'panel'
    ,autoScroll: true
    ,tbarCssClass: 'x-panel-white'
    ,loadMask: true
    ,padding:0
    ,layout: 'anchor'
    ,data: {}
    ,initComponent: function(){

        this.data = Ext.apply({}, this.data);

        this.objectsStore = new CB.DB.DirectObjectsStore({
            listeners:{
                scope: this
                ,add: this.onObjectsStoreChange
                ,load: this.onObjectsStoreChange
            }
        });

        this.grid = new CB.VerticalEditGrid({
            title: L.Details
            ,autoHeight: true
            ,minHeight: 100
            ,boxMinHeight: 100
            ,hidden: true
            ,refOwner: this
            ,includeTopFields: true
        });

        this.fieldsZone = new Ext.form.FormPanel({
            title: L.Fields
            ,header: false
            ,border: false
            ,autoHeight: true
            ,labelAlign: 'top'
            ,bodyStyle: 'margin:0; padding:0'
            ,items: []
            ,api: {
                submit: CB_Objects.save
            }
        });

        Ext.apply(this, {
            defaults: {
                anchor: '-5'
                ,style: 'margin: 0 0 15px 0'
            }
            ,items: [
                this.grid
                ,this.fieldsZone
            ]
            ,listeners: {
                scope: this
                ,change: this.onChange
            }
        });
        CB.form.edit.Object.superclass.initComponent.apply(this, arguments);
    }

    ,onChange: function(){
        this._isDirty = true;
    }

    ,load: function(objectData) {
        if(Ext.isEmpty(objectData)) {
            return;
        }

        if(Ext.isNumber(objectData)) {
            objectData = {id: objectData};
        }
        this.loadData(objectData);
    }

    ,loadData: function(objectData) {
        this.requestedLoadData = objectData;
        if(this._isDirty) {
            this.confirmDiscardChanges();
            return;
        }

        this.clear();
        this.getEl().mask(L.Loading + ' ...', 'x-mask-loading');

        if(Ext.isNumber(objectData.id)) {
            CB_Objects.load(
                {id: objectData.id}
                ,this.processLoadData
                ,this
            );
        } else {
            this.processLoadData({
                    success: true
                    ,data: objectData
                }
            );
        }
    }
    ,processLoadData: function(r, e) {
        this.getEl().unmask();
        if(r.success !== true) {
            return;
        }
        this.data = r.data;

        this.objectsStore.baseParams = {
            id: r.data.id
            ,template_id: r.data.template_id
        };
        this.objectsStore.reload();

        this.grid.reload();
        if(this.grid.store.getCount() > 0) {
            this.grid.show();
        }

        if(this.grid.templateStore) {
            var fields = [];
            this.grid.templateStore.each(
                function(r) {
                    if(r.get('cfg').showIn == 'tabsheet') {
                        var cfg = {
                            border: false
                            ,hideBorders: true
                            ,title: r.get('title')
                            ,isTemplateField: true
                            ,name: r.get('name')
                            ,value: this.data.data[r.get('name')]
                            ,height: Ext.value(r.get('cfg').height, 70)
                            ,anchor: '100%'
                            ,style: 'resize: vertical'
                            ,grow: true
                            ,fieldLabel: r.get('title')
                            ,listeners: {
                                scope: this
                                ,change: function(){ this.fireEvent('change'); }
                                ,sync: function(){ this.fireEvent('change'); }
                            }
                            ,xtype: (r.get('type') == 'html')
                                ? 'CBHtmlEditor'
                                : 'textarea'
                        };
                        this.fieldsZone.add(cfg);
                    }
                }
                ,this
            );
            this.fieldsZone.syncSize();
        }
        this._isDirty = false;

    }
    ,onObjectsStoreChange: function(store, records, options){
        Ext.each(
            records
            ,function(r){
                r.set('iconCls', getItemIcon(r.data));
            }
            ,this
        );
        if(this.grid && !this.grid.editing && this.grid.getEl()) {
            this.grid.getView().refresh();
        }
    }

    ,confirmDiscardChanges: function(){
        //if confirmed
        //save
        //  save and load new requested data
        //no
        //  load new requested data
        //  cancel
        //      discard requested data
        //
        Ext.Msg.show({
            title:  L.Confirmation
            ,msg:   L.SavingChangedDataMessage
            ,icon:  'ext-mb-question'
            ,buttons: Ext.Msg.YESNOCANCEL
            ,scope: this
            ,fn: function(b, text, opt){
                switch(b){
                    case 'yes':
                        this.save();
                        break;
                    case 'no':
                        this.clear();
                        this.loadData(this.requestedLoadData);
                        break;
                    default:
                        delete this.requestedLoadData;
                }
            }
        });
    }
    ,save: function(callback, scope) {
        if(!this._isDirty) {
            return;
        }
        this.grid.readValues();
        this.data.data = Ext.apply(this.data.data, this.fieldsZone.getForm().getFieldValues());

        if(callback) {
            this.saveCallback = callback.createDelegate(scope || this);
        }

        this.getEl().mask(L.Saving + ' ...', 'x-mask-loading');

        this.fieldsZone.getForm().submit({
            clientValidation: true
            ,params: {
                data: Ext.encode(this.data)
            }
            ,scope: this
            ,success: this.processSave
            ,failure: this.processSave
        });

    }
    ,processSave: function(form, action) {
        this.getEl().unmask();
        var r = action.result;
        if(r.success !== true) {
            delete this.saveCallback;
            return;
        }
        this._isDirty = false;
        if(this.saveCallback) {
            this.saveCallback(this);
            delete this.saveCallback;
        }
    }
    ,clear: function(){
        this.data = {};
        this.grid.hide();
        this.fieldsZone.removeAll(true);
        this._isDirty = false;
        this.fireEvent('clear', this);
    }

});

Ext.reg('CBEditObject', CB.form.edit.Object);
