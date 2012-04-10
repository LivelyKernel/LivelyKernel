module('lively.morphic.tests.redflag').requires().toRun(function() {

if(!window.redflag){
	window.redflag = {};
}

redflag = (function() {
	"use strict";
	
	var noteBookURL = '/fpm.simbusiness/rest/notebooks/',
		photosURL = '/fpm.simbusiness/rest/pages/',
		imageURL = '/fpm.simbusiness/rest/images/',
		canvas = document.getElementById('drawImg'),
		context = canvas.getContext('2d'),
		canvasOffset = $('#drawImg').offset(),
		drawer = {
					isDrawing: false,
					touchstart: function(coors){
						context.beginPath();
						context.moveTo(coors.x - canvasOffset.left, coors.y - canvasOffset.top - 45);
						this.isDrawing = true;
					},
					touchmove: function(coors){
						if(this.isDrawing){
							context.strokeStyle = "#df4b26";
							context.lineJoin = "round";
							context.lineWidth = 5;
							context.lineTo(coors.x - canvasOffset.left, coors.y - canvasOffset.top - 45);
							context.stroke();
						}
					},
					touchend: function(coors){
						if(this.isDrawing){
							this.touchmove(coors);
							this.isDrawing = false;
							
							// show comments when done drawing
							$('#comments').hide();
							$('#commentContainer').css({'top':'0px', 'right':'300px'});
							$('#commentContainer').show();
						}
					},
					mousedown: function(coors){
						context.beginPath();
						context.moveTo(coors.x - canvasOffset.left, coors.y - canvasOffset.top - 45);
						this.isDrawing = true;
					},
					mousemove: function(coors){
						if(this.isDrawing){
							context.strokeStyle = "#df4b26";
							context.lineJoin = "round";
							context.lineWidth = 5;
							context.lineTo(coors.x - canvasOffset.left, coors.y - canvasOffset.top - 45);
							context.stroke();
						}
					},
					mouseup: function(coors){
						if(this.isDrawing){
							this.mousemove(coors);
							this.isDrawing = false;
							
							// show comments when done drawing
							$('#comments').hide();
							$('#commentContainer').css({'top':'0px', 'right':'300px'});
							$('#commentContainer').show();
						}
					}
				};
	
	return {
		// draw on canvas
		draw: function(event){
			var coors = {};
			
			if(Modernizr.touch){
				coors = {
						x: event.targetTouches[0].pageX,
						y: event.targetTouches[0].pageY
				};
			}else {
				coors = {
						x: event.pageX,
						y: event.pageY
				};
			}
			console.log(event.type);
			drawer[event.type](coors);
		},
		
		// get albums for a user
		getAlbums: function(userName){
			var that = this;
			// remove all existing notebooks
			$('#albums').children('div').remove();
			
			// remove all existing pages
			$('#photos').children('div').remove();
			
			// make ajax call to get JSON object of user's notebooks
			$.getJSON(noteBookURL + userName, function(data){
				var notebook = [];
				
				if(data.notebook.length > 0){
					$.each(data.notebook, function(i, notebookObj){
						notebook[notebook.length] = '<div class="album" data-noteBookId="';
						notebook[notebook.length] = notebookObj.ID;
						notebook[notebook.length] = '"><div><h1>';
						notebook[notebook.length] = notebookObj.Title;
						notebook[notebook.length] = '</h1><p><span>Workbook: <b>';
						notebook[notebook.length] = notebookObj.WorkbookName;
						notebook[notebook.length] = '</b></span><span>Last updated: <b>';
						
						var arrDate = notebookObj.Date_Updated.split(' ');
						
						var year = arrDate[0].split('-')[0];
						var month = arrDate[0].split('-')[1];
						var day = arrDate[0].split('-')[2];
						
						notebook[notebook.length] = that.getMonth(month, true);
						notebook[notebook.length] = ' ';
						notebook[notebook.length] = day;
						notebook[notebook.length] = ', ';
						notebook[notebook.length] = year;
						notebook[notebook.length] = '</b></span></p></div></div>';
					});
				}else {
					notebook[notebook.length] = '<div class="album" data-noteBookId="';
					notebook[notebook.length] = data.notebook.ID;
					notebook[notebook.length] = '"><div><h1>';
					notebook[notebook.length] = data.notebook.Title;
					notebook[notebook.length] = '</h1><p><span>Workbook: <b>';
					notebook[notebook.length] = data.notebook.WorkbookName;
					notebook[notebook.length] = '</b></span><span>Last updated: <b>';
					
					var arrDate = data.notebook.Date_Updated.split(' ');
					
					var year = arrDate[0].split('-')[0];
					var month = arrDate[0].split('-')[1];
					var day = arrDate[0].split('-')[2];
					
					notebook[notebook.length] = that.getMonth(month, true);
					notebook[notebook.length] = ' ';
					notebook[notebook.length] = day;
					notebook[notebook.length] = ', ';
					notebook[notebook.length] = year;
					notebook[notebook.length] = '</b></span></p></div></div>';
				}
				
				$('#albums').append(notebook.join(''));
			});
		},
		
		// get comments for selected picture
		getComments: function(imageId){
			var that = this;
			
			// remove all existing comments
			$('#comments').children('li').remove();
			
			// make ajax call to get JSON object of comments for photo
			$.getJSON(photosURL + imageId + '/comments', function(data){
				var comment = [];
				
				if(data.comment.length > 0){
					$.each(data.comment, function(i, commentObj){
						comment[comment.length] = '<li data-commentId="';
						comment[comment.length] = commentObj.ID;
						comment[comment.length] = '">';
						comment[comment.length] = '<span>';
						comment[comment.length] = commentObj.User;
						comment[comment.length] = '</span>';
						comment[comment.length] = '<span>';
						comment[comment.length] = commentObj.DateSubmitted;
						comment[comment.length] = '</span>';
						comment[comment.length] = '<span>';
						comment[comment.length] = commentObj.Text;
						comment[comment.length] = '</span></li>';
					});
				}else {
					comment[comment.length] = '<li data-commentId="';
					comment[comment.length] = data.comment.ID;
					comment[comment.length] = '">';
					comment[comment.length] = '<span>';
					comment[comment.length] = data.comment.User;
					comment[comment.length] = '</span>';
					comment[comment.length] = '<span>';
					comment[comment.length] = data.comment.DateSubmitted;
					comment[comment.length] = '</span>';
					comment[comment.length] = '<span>';
					comment[comment.length] = data.comment.Text;
					comment[comment.length] = '</span></li>';
				}
				
				$('#comments').append(comment.join(''));
			});
		},
		
		// return month for passed in value
		getMonth: function (month, fullMonth) {
			var monthText = "";
			
			switch(month){
				case "01":
					if(fullMonth){
						monthText = "January";
					}else {
						monthText = "Jan";
					}
					break;
				case "02":
					if(fullMonth){
						monthText = "February";
					}else {
						monthText = "Feb";
					}
					break;
				case "03":
					if(fullMonth){
						monthText = "March";
					}else {
						monthText = "Mar";
					}
					break;
				case "04":
					if(fullMonth){
						monthText = "April";
					}else {
						monthText = "Apr";
					}
					break;
				case "05":
					if(fullMonth){
						monthText = "May";
					}else {
						monthText = "May";
					}
					break;
				case "06":
					if(fullMonth){
						monthText = "June";
					}else {
						monthText = "Jun";
					}
					break;
				case "07":
					if(fullMonth){
						monthText = "July";
					}else {
						monthText = "Jul";
					}
					break;
				case "08":
					if(fullMonth){
						monthText = "August";
					}else {
						monthText = "Aug";
					}
					break;
				case "09":
					if(fullMonth){
						monthText = "September";
					}else {
						monthText = "Sep";
					}
					break;
				case "10":
					if(fullMonth){
						monthText = "October";
					}else {
						monthText = "Oct";
					}
					break;
				case "11":
					if(fullMonth){
						monthText = "November";
					}else {
						monthText = "Nov";
					}
					break;
				case "12":
					if(fullMonth){
						monthText = "December";
					}else {
						monthText = "Dec";
					}
					break;
			}
			
			return monthText;
		},
		
		// return photos for a selected album
		getPhotos: function(albumId){
			var that = this;
			// remove all existing pages
			$('#photos').children('div').remove();
			
			// make ajax call to get JSON object of notebook's photos
			$.getJSON(photosURL + albumId, function(data){
				var photo = [];
				
				if(data.page.length > 0){
					$.each(data.page, function(i, photoObj){
						photo[photo.length] = '<div class="photo" data-photoId="';
						photo[photo.length] = photoObj.ID;
						photo[photo.length] = '" data-imageId="';
						photo[photo.length] = photoObj.ImageID;
						//photo[photo.length] = '" style="background: url(\'';
						//photo[photo.length] = imageURL + photoObj.ImageID;
						//photo[photo.length] = '\')">';
						//photo[photo.length] = '" style="background: url(\'/fpm.simbusiness/rest/approval/image/1000\')">';
						photo[photo.length] = '" style="background:url(\'images/polaroid.png\') no-repeat;"><img style="margin:24px 13px;" src="';
						photo[photo.length] = imageURL + photoObj.ImageID;
						photo[photo.length] = '" />';
						photo[photo.length] = '</div>';
					});
				}else {
						photo[photo.length] = '<div class="photo" data-photoId="';
						photo[photo.length] = data.page.ID;
						photo[photo.length] = '" data-imageId="';
						photo[photo.length] = data.page.ImageID;
						//photo[photo.length] = '" style="background: url(\'';
						//photo[photo.length] = imageURL + photoObj.ImageID;
						//photo[photo.length] = '\')">';
						//photo[photo.length] = '" style="background: url(\'/fpm.simbusiness/rest/approval/image/1000\')">';
						photo[photo.length] = '" style="background:url(\'images/polaroid.png\') no-repeat;"><img style="margin:24px 13px;" src="';
						photo[photo.length] = imageURL + data.page.ImageID;
						photo[photo.length] = '" />';
						photo[photo.length] = '</div>';
				}
				
				$('#photos').append(photo.join(''));
			});
		},
		
		// load selected image onto canvas
		loadImage: function(imageId){
			this.getComments(imageId);
			$('#activeImg').css({'background': 'url(\'' + imageURL + imageId + '\') no-repeat top left'});
			$('#activeImg').attr('data-pageId', imageId);
		},
		
		// post comment
		postComment: function(userName, comment, pageId){
			var params = {ID:"",PageID:pageId,AnnotationID:"0",User:userName,Text:comment,DateSubmitted:""};
			
			$.ajax({
				url: photosURL + pageId + '/comments',
				type: "POST",
				contentType: 'application/json',
				async: true,
				data: JSON.stringify(params),
				dataType: 'json',
				success: function(data){
					var comment = [];
					comment[comment.length] = '<li data-commentId="';
					comment[comment.length] = data.ID;
					comment[comment.length] = '">';
					comment[comment.length] = '<span>';
					comment[comment.length] = data.User;
					comment[comment.length] = '</span>';
					comment[comment.length] = '<span>';
					comment[comment.length] = data.DateSubmitted;
					comment[comment.length] = '</span>';
					comment[comment.length] = '<span>';
					comment[comment.length] = data.Text;
					comment[comment.length] = '</span></li>';
					
					$('#comments').append(comment.join(''));
				},
				error: function(error){ 
					alert('post fail');
				}
			});
		}
	};
})();

}) // end of module