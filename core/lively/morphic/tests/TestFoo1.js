module('lively.morphic.tests.Admin').requires().toRun(function() {
// Globals -------------------------------------------------------------------
var data_attrib = null;
var data_prop = null;
var data_model = null;
var url_attrib = "http://localhost:8080/fpm.simbusiness/rest/attributes";
var url_prop = "http://localhost:8080/fpm.simbusiness/rest/properties";
var url_model = "http://localhost:8080/fpm.simbusiness/rest/models";
var g_attrib_id = null;
var g_attrib_tablename = null;
var g_model_id = null;
var g_attrib = null;
var g_prop = null;

function init(){
	// sizing
	$("#model_main").width('' + $(window).width() -25 + 'px');
	$("#attr_main").width('' + $(window).width() -25 + 'px');
	$("#prop_main").width('' + $(window).width() -25 + 'px');
	$("#prop_main").height('' + $(window).height() -600 + 'px');
	
	// event handler bindings
	

	// load some data
	fetchAttributes();
	fetchModels();
}



// Models -------------------------------------------------------------------------------------
function fetchModels()
{
	
	$('#model_main_scroll').empty();
	
	$.ajax({
        url: url_model,
        dataType: "json",
        error: function(XMLHttpRequest, textStatus, errorThrown){
            alert("fail getting models: "+XMLHttpRequest.responseText);
        },
        success: function(json) {
        	data_model = json;
        	// .models.Name if len = 1
        	// .models[x].Name if len > 1
        	buildModels();
		}
    });
}

function buildModels()
{
	
	if (data_model.models.length == null ){
		// only one model
		buildModel(data_model.models);
	} else {
		// multiple models
		jQuery.each(data_model.models, function(index, model){
			buildModel(model);
		});
		
	}
	
	
}

function buildModel(model){
	
	jQuery('<div/>', {
	    id: 'mod_' + model.ID,
	    class: 'model'
	})
	.appendTo('#model_main_scroll')
	.click(model, function(evt){
		//alert(evt.data.Name);
		$("div.model").removeClass('selected');
		$(this).addClass('selected');

		g_model_id = model.ID;
		
		$('.attribute').removeClass('included');
		
		if (jQuery.isArray(model.Attributes)){
			jQuery.each(model.Attributes, function(index,attrib){
				$("#attr_"+attrib).addClass('included');
			});
		} else {
		
			$("#attr_"+model.Attributes).addClass('included');
		
		}
		
	});
	
	jQuery('<h3/>',{
		text: model.Name
	}).appendTo('#mod_' + model.ID);
	
	jQuery('<label/>',{
		class: 'subtitle',
		text: model.Description
	}).appendTo('#mod_' + model.ID);
	
	

	// HACK
	
	// delete button -------------
	jQuery('<button/>',{
		text:'Delete'
	}).appendTo('#mod_' + model.ID)
	.click(model,function(evt){
		evt.stopPropagation();
		if (confirm("Are you sure you want to delete this model?")){
			//url_attrib + '/' + evt.data
			$.ajax({
		        url: url_model + '/' + evt.data.ID,
				type: "DELETE",
		        error: function(XMLHttpRequest, textStatus, errorThrown){
		            alert("delete error: "+XMLHttpRequest.responseText);
		        },
		        success: function(json) {
					//alert("The item has been deleted");
		        	fetchModels();
				}
		    });
		}
		
	});
}

function showModelCreate(event){
	$("#model_create").toggle();
}

function createModel(){

	var model = {
			"Name" : $("#model_add_name").val(),
			"Description" : $("#model_add_desc").val(),
			"Attributes" : null
    };
	
	data = JSON.stringify(model);
	
	$.ajax({
		url: url_model,
		type: "POST",
        data: data,
        accepts: "application/json",
        contentType: "application/json",
        error: function(XMLHttpRequest, textStatus, errorThrown){
        	alert("fail adding model: " + XMLHttpRequest.responseText);
        },
        success: function(json) {
        	showModelCreate(null);
        	fetchModels();
        	
		}
    });
}

// Attributes -------------------------------------------------------------------------------------

function fetchAttributes()
{
	
	$('#attr_main_scroll').empty();
	$('#prop_main').empty();
	
	$.ajax({
        url: url_attrib,
        dataType: "json",
        error: function(XMLHttpRequest, textStatus, errorThrown){
            alert("fail getting attributes: "+XMLHttpRequest.responseText);
        },
        success: function(json) {
        	data_attrib = json;
        	buildAttributes();
		}
    });
}

function buildAttributes()
{
	
	
	jQuery.each(data_attrib.attributes, function(index, attribute){
		
		var deleteid = attribute.id.toString();
		var Id = 'attr_' + attribute.id.toString();
		var name = attribute.name.toString();
		var description = attribute.description.toString();
		var display = attribute.displayColumn.toString();
		var manageid = attribute.manageId;
		var tableName = attribute.tableName;
		
		//var eventData = {"ID":deleteid,"TableName":tableName};
		
		//if (manageid = 1) managed = "true" else managed = "false";
		
		var managed = manageid==1?"true":"false";
		
		jQuery('<div/>', {
		    id: Id,
		    class: 'attribute'
		})
		.appendTo('#attr_main_scroll')
		.click(attribute, function(evt){
			// table name is in evt.data;
			// load properties for this table
			$(".attribute").removeClass("selected");
			$(this).addClass("selected");
			fetchProperties(evt.data.tableName);
			g_attrib_id = evt.data.id;
			g_attrib_tablename = evt.data.tableName;
			g_attrib = evt.data;
		});
		
		
		jQuery('<h3/>',{
			text: name
		}).appendTo('#' + Id);
		
		jQuery('<label/>',{
			class: 'subtitle',
			text: description
		}).appendTo('#' + Id);
		
		jQuery('<dl/>',{
			id: 'dl_' + Id,
			class: 'itemlist'
		}).appendTo('#' + Id);

		jQuery('<dt/>',{
			text: 'Displays:'
		}).appendTo('#' + 'dl_' + Id);

		jQuery('<dd/>',{
			text:display
		}).appendTo('#' + 'dl_' + Id);

		jQuery('<dt/>',{
			text: 'Managed:'
		}).appendTo('#' + 'dl_' + Id);

		jQuery('<dd/>',{
			text:managed
		}).appendTo('#' + 'dl_' + Id);
		
		// TYPE
		jQuery('<dt/>',{
			text: 'Type:'
		}).appendTo('#' + 'dl_' + Id);

		jQuery('<dd/>',{
			text:attribute.type
		}).appendTo('#' + 'dl_' + Id);
		
		
		// TAGS
		jQuery('<dt/>',{
			text: 'Tags:'
		}).appendTo('#' + 'dl_' + Id);

		jQuery('<dd/>',{
			text:attribute.tags
		}).appendTo('#' + 'dl_' + Id);
		
		
		// delete button -------------
		jQuery('<button/>',{
			text:'Delete'
		}).appendTo('#' + Id)
		.click(deleteid,function(evt){
			evt.stopPropagation();
			if (confirm("Are you sure you want to delete this attribute?")){
				//url_attrib + '/' + evt.data
				$.ajax({
			        url: url_attrib + '/' + evt.data,
					type: "DELETE",
			        error: function(XMLHttpRequest, textStatus, errorThrown){
			            alert("delete error: "+XMLHttpRequest.responseText);
			        },
			        success: function(json) {
						//alert("The item has been deleted");
						fetchAttributes();
					}
			    });
			}
			
		});
		
		// remove from model button -------------
		jQuery('<button/>',{
			text:'Remove from Model'
		}).appendTo('#' + Id)
		.click(deleteid,function(evt){
			evt.stopPropagation();
			
			$.ajax({
		        url: url_model + '/' + g_model_id + "/remove/" + evt.data,
				type: "PUT",
		        error: function(XMLHttpRequest, textStatus, errorThrown){
		            alert("alter model error: "+XMLHttpRequest.responseText);
		        },
		        success: function(json) {
					//alert("item added to model");
					//fetchAttributes();
		        	fetchModels();
		        	
				}
		    });
			
			
		});
		
		// add to model button -------------
		jQuery('<button/>',{
			text:'Add to Model'
		}).appendTo('#' + Id)
		.click(deleteid,function(evt){
			evt.stopPropagation();
			
			$.ajax({
		        url: url_model + '/' + g_model_id + "/add/" + evt.data,
				type: "PUT",
		        error: function(XMLHttpRequest, textStatus, errorThrown){
		            alert("alter model error: "+XMLHttpRequest.responseText);
		        },
		        success: function(json) {
					//alert("item added to model");
					//fetchAttributes();
		        	fetchModels();
		        	
				}
		    });
			
			
		});
		
	});
	

}

function showAttributeCreate(evt){

	$("#attr_create").toggle();
}

function addAttribute()
{
	var name = $("#attr_input_name").val();
	var description = $("#attr_input_desc").val();
	var manageid = $("#attr_input_manage").is(":checked")?"1":"0";
	var hierarchy = $("#attr_input_hierarchy").is(":checked")?"1":"0";
	var properties = "";
	var prop;
	var checkboxes = $(".attr_add_display");
	var displayCol = '';
	var atype = $("#attr_input_type").val();
	var tags= $("#attr_input_tags").val();
	
	jQuery.each($('.attr_add_property'),function(index,property){
		if ($(property).val() != ""){
			
			type = $(".attr_add_prop_type_" + (index+1)).val();
			prop = $(property).val() + "|" + type;
			
			if (properties.length > 0 ) {
				prop = "," + prop;
			}
			properties = properties + prop;
			
			// set name as display column
			if ($(checkboxes[index]).is(":checked"))
				displayCol = $(property).val();
		}
	});
	
	
	var attrib = {
			"description" : description,
			"displayColumn" : displayCol,
			"hierarchy" : hierarchy,
			"manageId" : manageid,
            "name" : name,
			"properties" : properties,
			"tags" : tags,
			"type" : atype
    };
	
	data = JSON.stringify(attrib);
	
	$.ajax({
        url: url_attrib,
		type: "POST",
        data: data,
        accepts: "application/json",
        contentType: "application/json",
        error: function(XMLHttpRequest, textStatus, errorThrown){
            alert("post error: "+XMLHttpRequest.responseText);
        },
        success: function(json) {
			//alert('success post: ' + json);
        	
        	fetchAttributes();
        	
        	// hide the add dialog
        	showAttributeCreate(null);
        	// clear the fields...
        	$("#attr_input_name").val('');
        	$("#attr_input_desc").val('');
        	$("#attr_input_manage").val('');
        	$("#attr_input_hierarchy").val('');
        	$('.attr_add_property').val('');
        	$('.datatype').val('');
		}
    });
	
	
}


// Properties ---------------------------------------------------------------------------

function fetchProperties(tablename) {
	
	$('#prop_main').empty();
	var url = url_prop + "/" + tablename + "/";
	
	$.ajax({
        url: url,
        processData: false,
		type: "GET",
        error: function(XMLHttpRequest, textStatus, errorThrown){
        	alert("fail getting properties: " + XMLHttpRequest.responseText);
        },
        success: function(json) {
			data_prop = json;
			buildProperties();
			g_prop = data_prop.properties;
		}
    });
}

function buildProperties() {

	
	jQuery.each(data_prop.properties, function(index, property){
		
		var name = property.name.toString();
		var Id = 'prop_' + name.replace(' ','_');
		var type = property.dataType.toString();
		var size = property.dataSize.toString();
		
		jQuery('<div/>', {
		    id: Id,
		    class: 'property'
		}).appendTo('#prop_main');
		
		
		if (name == "ID" || name=="PARENTID"){
			$("#" + Id).addClass("required");
		}
		
		
		jQuery('<h3/>',{
			text: name
		}).appendTo('#' + Id);
		
		jQuery('<label/>',{
			class: 'subtitle',
			text: type + ' ' + size
		}).appendTo('#' + Id);
		
		// HACK
		jQuery('<br/>').appendTo('#'+Id);
		jQuery('<br/>').appendTo('#'+Id);
		
		jQuery('<button/>',{
			text: 'X'
		}).appendTo('#'+Id)
		.click(name,function(evt){
			evt.stopPropagation();
			if (confirm("Are you sure you want to delete this property?")){
				
				//evt.data.name = column name
				var prop = {
						"name" : evt.data,
						"type" : ""
			    };
				
				data = JSON.stringify(prop);
				
				$.ajax({
			        url: url_prop + "/" + g_attrib_id + "/",
					type: "DELETE",
					data: data,
			        accepts: "application/json",
			        contentType: "application/json",
			        error: function(XMLHttpRequest, textStatus, errorThrown){
			            alert("delete error: "+XMLHttpRequest.responseText);
			        },
			        success: function(json) {
						//alert("The item has been deleted");
						fetchProperties(g_attrib_tablename);
					}
			    });
			}
			
		});;
		
		
	});
	
	//$("#prop_ID").addClass("required");
}

function showPropertyCreate(evt){
	$('#prop_create').toggle();
}

function createProperty(){
	
	var prop = {
			"name" : $("#prop_add_name").val(),
			"type" : $("#prop_add_type").val()
    };
	
	data = JSON.stringify(prop);
	
	var url = url_prop + "/" + g_attrib_id + "/";
	
	$.ajax({
		url: url,
		type: "POST",
        data: data,
        accepts: "application/json",
        contentType: "application/json",
        error: function(XMLHttpRequest, textStatus, errorThrown){
        	alert("fail adding property: " + XMLHttpRequest.responseText);
        },
        success: function(json) {
			data_prop = json;
			fetchProperties(g_attrib_tablename);
			showPropertyCreate(null);
			$("#prop_add_name").val("");
			$("#prop_add_type").val("");
		}
    });
	
}


// -- Property Data -----------------------------------------------------------

function showPropertyData(e){
	propdiv = $('#prop_data');
	propdiv.empty();
	
	jQuery('<h3/>',{
		text: g_attrib.name
	}).appendTo(propdiv);
	
	
	// create a table 
	
	table = jQuery('<table/>',{
		class:'propertytable'
	}).appendTo(propdiv);
	
	cols = g_prop.length;
	
	tr = jQuery('<tr/>').appendTo(table);
	jQuery.each(g_prop, function(index, property){
		
		jQuery('<td/>',{
			text: property.name,
			width: '' + parseInt(100/cols) + '%',
			class:'propertytableheader'
		}).appendTo(tr);
	
	});
	
	
	
	jQuery('<button/>',{
		text: 'Add'
	}).appendTo(propdiv)
	.click(function(event){
		addPropertyData(e);
	});
	
	jQuery('<button/>',{
		text: 'close'
	}).appendTo(propdiv)
	.click(function(event){
		propdiv.toggle();
	});
	
	
	
	propdiv.toggle();
	
	$.ajax({
        url: url_prop + '/data/'+ g_attrib.tableName,
        processData: false,
		type: "GET",
        error: function(XMLHttpRequest, textStatus, errorThrown){
        	alert("fail getting property data: " + XMLHttpRequest.responseText);
        },
        success: function(json) {

        	
        	
        	if (json != null ) {
        		
	        	//var rows = [];
	        	$.each(json.Rows, function(index,cells){
	        		//var row = new Array();
	        		
	        		tr = jQuery('<tr/>').appendTo(table);
	        		
	        		

	        		if (jQuery.isArray(cells)){
        				$.each(cells, function(index2,cell){
		        			
		        			//row[index2]=cell.Value;
		        			
		        			jQuery('<td/>',{
			        			text: cell.Value,
			        			width: '' + parseInt(100/cols) + '%'
			        		}).appendTo(tr);
		        			
		        		});
	        		} else {
	        			$.each(cells.Cells, function(index2,cell){
		        			
		        			//row[index2]=cell.Value;
		        			
		        			jQuery('<td/>',{
			        			text: cell.Value,
			        			width: '' + parseInt(100/cols) + '%'
			        		}).appendTo(tr);
		        			
		        		});
	        		}
	        		
	        		
	        		
        				
	        			
	        	
	        		//rows.push(row);
	        	});
	        	
        	}
        	
  
        	
        	
        	
        	// build an "add new" row
        	
        	tr = jQuery('<tr/>').appendTo(table);
        	jQuery.each(g_prop, function(index, property){
        		
        		td = jQuery('<td/>',{
        			width: '' + parseInt(100/cols) + '%'
        		}).appendTo(tr);
        		
        		
        		jQuery('<input/>',{
        			text:'new',
        			width: '100%',
        			class: 'newpropdata'
        		}).appendTo(td);
        	
        	});
        	
		}
    });
	
	
}


function addPropertyData(e){
	alert($('.newpropdata'));
}

}) // end of module