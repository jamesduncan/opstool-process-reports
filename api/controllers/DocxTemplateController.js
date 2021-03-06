/**
 * DocxTemplateController
 *
 * @description :: Server-side logic for managing Userteams
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var AD = require('ad-utils'),
	async = require('async'),
	_ = require('lodash'),
	moment = require('moment'),
	fs = require('fs'),
	DocxGen = require('docxtemplater'),
	DocxImageModule = require('docxtemplater-image-module'),
	sizeOf = require('image-size'),
	renderReportController = require('fcf_activities/api/controllers/RenderReportController.js');

var changeThaiFormat = function (momentDate, format) {
	if (!format)
		format = 'D MMMM YYYY';

	return momentDate.add(543, 'years').locale('th').format(format);
}

module.exports = {
	// /opstool-process-reports/docxtemplate/activities
	activities: function (req, res) {
		AD.log('<green>::: docxtemplate.activities() :::</green>');

		var data = { staffs: null };
		var activities;
		var activityImages;
		var resultBuffer;

		var staffName = req.param('Member name');
		var startDate = req.param('Start date');
		var endDate = req.param('End date');
		var projectName = req.param('Project');

		var startDateObj, endDateObj;

		async.series([

			// Get data
			function (next) {
				async.parallel([
					// Get staffs data
					function (callback) {
						renderReportController.staffs(req, {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									data.staffs = r.data;
								}

								callback();
							}
						});
					},
					// Get activities data
					function (callback) {
						renderReportController.activities(req, {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success')
									activities = r.data;

								callback();
							}
						});
					},
					// Get actiivity images data
					function (callback) {
						renderReportController.activity_images(req, {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									activityImages = r.data;
								}

								callback();
							}
						});

					}
				], function (err) {
					next(err);
				});
			},

			// Convert data to support docx template
			function (next) {
				// Staffs filter
				if (staffName) {
					_.remove(data.staffs, function (s) {
						return s.person_name.indexOf(staffName) < 1;
					});
				}

				// Activities start date filter
				if (startDate) {
					startDateObj = moment(startDate, 'M/D/YY', 'en');

					_.remove(activityImages, function (img) {
						if (img.image_date && moment(img.image_date) < startDateObj)
							return true;
						else
							return false;
					});

					if (startDateObj.isValid())
						data.startDate = changeThaiFormat(startDateObj, 'MMMM YYYY');
				}

				// Activities end date filter
				if (endDate) {
					endDateObj = moment(endDate, 'M/D/YY', 'en');

					_.remove(activityImages, function (img) {
						if (img.image_date && endDateObj < moment(img.image_date))
							return true;
						else
							return false;
					});

					if (endDateObj.isValid())
						data.endDate = changeThaiFormat(endDateObj, 'MMMM YYYY');
				}

				// Project name filter
				if (projectName) {
					_.remove(activities, function (a) {
						return a.project_name != projectName;
					});
				}

				// Activity images filter
				_.remove(activityImages, function (img) {
					if (activities.filter(function (act) { return act.activity_id == img.activity_id; }).length < 1)
						return true;
					else
						return false;
				});

				// var numberRawTemplate = '<w:numbering>#absNumberList##numberList#</w:numbering>';
				// var absNumberRawTemplate = '<w:abstractNum w:abstractNumId="#numId#"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="1440"/></w:tabs><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%2."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="1800"/></w:tabs><w:ind w:left="1800" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%3."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="2160"/></w:tabs><w:ind w:left="2160" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="3"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%4."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="2520"/></w:tabs><w:ind w:left="2520" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="4"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%5."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="2880"/></w:tabs><w:ind w:left="2880" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="5"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%6."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="3240"/></w:tabs><w:ind w:left="3240" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="6"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%7."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="3600"/></w:tabs><w:ind w:left="3600" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="7"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%8."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="3960"/></w:tabs><w:ind w:left="3960" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="8"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%9."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="4320"/></w:tabs><w:ind w:left="4320" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>';
				// var numberItemRawTemplate = '<w:num w:numId="#numId#"><w:abstractNumId w:val="#numId#"/></w:num>';

				// var absNumberRawXml = '',
				// 	numberItemRawXml = '';

				data.staffs.forEach(function (s, index) {
					// Convert date time to Thai format
					var visaStartDate = moment(s.person_visa_start_date);
					if (visaStartDate.isValid())
						s.person_visa_start_date = changeThaiFormat(visaStartDate);

					var visaExpireDate = moment(s.person_visa_expire_date);
					if (visaExpireDate.isValid())
						s.person_visa_expire_date = changeThaiFormat(visaExpireDate);

					s.activities = _.filter(activities, function (a) {
						return s.person_id == a.person_id;
					});

					s.activity_image_captions = [];
					s.activity_image_captions.runningOrder = 1;
					s.activity_image_captions.addCaption = function (caption) {
						// Ampersand (&) is reserve work of word format.
						caption = caption.replace(/&/g, 'and');

						// // Prevent duplicate caption & Remove undefined 
						// if (this.filter(function (item) { return item.caption == caption; }).length > 0
						// 	|| caption.indexOf('undefined') > -1) return;

						this.push({
							order: this.runningOrder,
							caption: caption
						});
						this.runningOrder++;
					};

					var activity_images = _.filter(activityImages, function (img) { return s.person_id == img.person_id; });
					activity_images.forEach(function (img) {

						if (img.image_caption_govt) { // Government caption
							s.activity_image_captions.addCaption(img.image_caption_govt);
						}
						else if (img.image_caption) { // Ministry caption
							s.activity_image_captions.addCaption(img.image_caption);
						}

					});

					// var actItemTemplate = '<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:widowControl/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="#numListId#"/></w:numPr><w:suppressAutoHyphens w:val="true"/><w:bidi w:val="0"/><w:spacing w:lineRule="auto" w:line="240" w:before="0" w:after="0"/><w:ind w:left="1080" w:right="0" w:hanging="360"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Angsana New" w:hAnsi="Angsana New" w:cs="Angsana New"/><w:sz w:val="32"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Angsana New" w:hAnsi="Angsana New" w:cs="Angsana New"/><w:sz w:val="32"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t>#caption#</w:t></w:r></w:p>';

					// s.activitiesRawXml = '';

					// s.activity_image_captions.forEach(function (imgCaption) {
					// 	s.activitiesRawXml += actItemTemplate.replace(/#numListId#/g, index + 3).replace('#caption#', imgCaption.caption);
					// });

					// if (s.activity_image_captions && s.activity_image_captions.length > 0) {
					// 	absNumberRawXml += absNumberRawTemplate.replace(/#numId#/g, index + 3);
					// 	numberItemRawXml += numberItemRawTemplate.replace(/#numId#/g, index + 3);
					// }

					s.activitiesRawXml = '';
					if (s.activity_image_captions && s.activity_image_captions.length > 0) {
						s.activity_image_captions.forEach(function (imgCaption) {
							s.activitiesRawXml += ('<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:widowControl/><w:tabs><w:tab w:val="left" w:pos="540" w:leader="none"/></w:tabs><w:suppressAutoHyphens w:val="true"/><w:bidi w:val="0"/><w:spacing w:lineRule="auto" w:line="240" w:before="0" w:after="0"/><w:ind w:left="720" w:right="0" w:hanging="0"/><w:jc w:val="left"/><w:rPr><w:rFonts w:cs="Angsana New" w:ascii="Angsana New" w:hAnsi="Angsana New"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Angsana New" w:ascii="Angsana New" w:hAnsi="Angsana New"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">#order#. #caption#</w:t></w:r></w:p>'
								.replace('#order#', imgCaption.order)
								.replace('#caption#', imgCaption.caption));
						});
					}

				});

				// // Define number list style to template
				// data.numberRawXml = numberRawTemplate.replace('#absNumberList#', absNumberRawXml).replace('#numberList#', numberItemRawXml);

				_.remove(data.staffs, function (s) {
					return s.activities == null || !s.activities || s.activities.length < 1;
				});

				next();
			},

			// Generate docx file
			function (next) {
				// TODO : Get file binary from database
				fs.readFile(__dirname + "/../../docx templates/activities template.docx", "binary", function (err, content) {
					var docx = new DocxGen()
						.load(content)
						.setData(data).render();

					resultBuffer = docx.getZip().generate({ type: "nodebuffer" });

					next();
				});
			}

		], function (err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end docxtemplate.activities() :::</green>');

				var buff = new Buffer(resultBuffer, 'binary');

				res.set({
					"Content-Disposition": 'attachment; filename="' + 'activities.docx' + '"',
					"Content-Type": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					"Content-Length": buff.length
				});

				res.send(buff);
			}
		});
	},

	// /opstool-process-reports/docxtemplate/activity_images
	activity_images: function (req, res) {
		AD.log('<green>::: docxtemplate.activity_images() :::</green>');

		var data = { staffs: null };
		var activity_images;
		var resultBuffer;

		var staffName = req.param('Member name');
		var startDate = req.param('Start date');
		var endDate = req.param('End date');
		var projectName = req.param('Project');

		var startDateObj, endDateObj;

		var columnImages = [];

		async.series([

			// Get data
			function (next) {
				async.parallel([
					// Get staffs data
					function (callback) {
						var temp_res = {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									data.staffs = r.data;
								}

								callback();
							}
						};

						renderReportController.staffs(req, temp_res);
					},
					// Get activity images data
					function (callback) {
						var temp_res = {
							send: function (result, code) {
								var r = JSON.parse(result);
								if (r.status === 'success') {
									activity_images = r.data;
								}

								callback();
							}
						};

						renderReportController.activity_images(req, temp_res);
					}
				], function (err) {
					next(err);
				});
			},

			function (next) {
				if (startDate) {
					startDateObj = moment(startDate, 'M/D/YY', 'en');
				}

				if (endDate) {
					endDateObj = moment(endDate, 'M/D/YY', 'en');
				}

				_.remove(activity_images, function (img) {
					if (startDateObj != null && (moment(img.image_date) < startDateObj)) {
						return true;
					}
					else if (endDateObj != null && (moment(img.image_date) > endDateObj)) {
						return true;
					}
					else {
						return false;
					}
				});

				if (startDateObj && startDateObj.isValid())
					data.startDate = changeThaiFormat(startDateObj)
				if (endDateObj && endDateObj.isValid())
					data.endDate = changeThaiFormat(endDateObj)

				next();
			},

			function (next) {
				var groupedImages = _.groupBy(_.uniq(activity_images), function (img) {
					return img.activity_id + '&' + img.person_id;
				});

				for (var actId in groupedImages) {
					var img = groupedImages[actId];
					for (var i = 0; i < img.length; i += 2) {

						var result = {
							'person_id': img[i].person_id,
							'activity_id': img[i].activity_id,
							'activity_name': img[i].activity_name,
							'activity_name_govt': img[i].activity_name_govt,
							'activity_description': img[i].activity_description,
							'activity_description_govt': img[i].activity_description_govt,
							'activity_start_date': img[i].activity_start_date,
							'activity_end_date': img[i].activity_end_date,
							'activity_image_file_name_left_column': img[i].image_file_name,
							'activity_image_caption_left_column': img[i].image_caption,
							'activity_image_caption_govt_left_column': img[i].image_caption_govt,
							'activity_image_date_left_column': img[i].image_date,
							'project_id': img[i].project_id,
							'project_name': img[i].project_name
						};

						var right_column_img = img[i + 1];
						if (right_column_img) {
							result.activity_image_file_name_right_column = right_column_img.image_file_name;
							result.activity_image_caption_right_column = right_column_img.image_caption;
							result.activity_image_caption_govt_right_column = right_column_img.image_caption_govt;
							result.activity_image_date_right_column = right_column_img.image_date;
						}
						else {
							result.activity_image_file_name_right_column = 'blank.jpg';
						}

						columnImages.push(result);
					}
				}

				next();
			},

			// Convert data to support docx template
			function (next) {
				// Staffs filter
				if (staffName) {
					data.staffs = _.filter(data.staffs, function (s) {
						return s.person_name.indexOf(staffName) > -1 || s.person_name_en.indexOf(staffName) > -1;
					});
				}

				// Project name filter
				if (projectName) {
					_.remove(columnImages, function (a) {
						return a.project_name != projectName;
					});
				}

				// Delete null value properties
				columnImages.forEach(function (img, index) {
					if (img['activity_image_file_name_right_column'] == null || img['activity_image_file_name_right_column'] === 'blank.jpg')
						delete img['activity_image_file_name_right_column'];

					if (img['activity_image_date_left_column'] == null)
						img['activity_image_date_left_column'] = '';

					if (img['activity_image_date_right_column'] == null)
						img['activity_image_date_right_column'] = '';

					if (img['activity_image_caption_left_column'] == null)
						img['activity_image_caption_left_column'] = '';

					if (img['activity_image_caption_right_column'] == null)
						img['activity_image_caption_right_column'] = '';

					if (img['activity_image_caption_govt_left_column'] == null)
						img['activity_image_caption_govt_left_column'] = '';

					if (img['activity_image_caption_govt_right_column'] == null)
						img['activity_image_caption_govt_right_column'] = '';
				});

				data.staffs.forEach(function (s, index) {
					var activities = _.filter(columnImages, function (img) {
						var isInProject = true;
						if (projectName) {
							isInProject = (img.project_name == projectName);
						}
						return img.person_id == s.person_id && isInProject;
					});

					// Group activities
					var groupedActivities = _.groupBy(activities, 'activity_id');

					var image_row_number = 0;
					s.activities = _.transform(groupedActivities, function (result, current) {
						var r = {};

						// Show page header
						if (image_row_number === 1 || (image_row_number - 1) % 2 === 0)
							r.activity_has_header = true;

						r.activity_name = current[0].activity_name;
						r.activity_description = current[0].activity_description;
						r.activity_name_govt = current[0].activity_name_govt;
						r.activity_description_govt = current[0].activity_description_govt;
						r.images = _.map(current, function (img) {
							var image = {};


							if (img.activity_image_file_name_left_column)
								image.activity_image_file_name_left_column = img.activity_image_file_name_left_column;

							if (img.activity_image_date_left_column != "")
								img.activity_image_date_left_column = changeThaiFormat(moment(img.activity_image_date_left_column), "DD/MM/YYYY");

							if (img.activity_image_caption_left_column)
								image.activity_image_caption_left_column = img.activity_image_date_left_column + " - " + img.activity_image_caption_left_column;
							else
								image.activity_image_caption_left_column = '';

							if (img.activity_image_caption_govt_left_column)
								image.activity_image_caption_govt_left_column = img.activity_image_date_left_column + " - " + img.activity_image_caption_govt_left_column;
							else if (img.activity_image_caption_left_column)
								image.activity_image_caption_govt_left_column = image.activity_image_caption_left_column;
							else
								image.activity_image_caption_govt_left_column = '';


							if (img.activity_image_file_name_right_column)
								image.activity_image_file_name_right_column = img.activity_image_file_name_right_column;

							if (img.activity_image_date_right_column != "")
								img.activity_image_date_right_column = changeThaiFormat(moment(img.activity_image_date_right_column), "DD/MM/YYYY");

							if (img.activity_image_caption_right_column)
								image.activity_image_caption_right_column = img.activity_image_date_right_column + " - " + img.activity_image_caption_right_column;
							else
								image.activity_image_caption_right_column = '';

							if (img.activity_image_caption_govt_right_column)
								image.activity_image_caption_govt_right_column = img.activity_image_date_right_column + " - " + img.activity_image_caption_govt_right_column;
							else if (img.activity_image_caption_right_column)
								image.activity_image_caption_govt_right_column = image.activity_image_caption_right_column;
							else
								image.activity_image_caption_govt_right_column = '';

							// Show page header
							if (!r.activity_has_header && (image_row_number === 1 || (image_row_number - 1) % 2 === 0))
								image.has_header = true;

							image_row_number++;

							return image;
						});

						result.push(r);

					}, []);

				});

				// Remove staffs who don't have any activities
				_.remove(data.staffs, function (s) {
					return s.activities == null || !s.activities || s.activities.length < 1;
				});

				data.activity_image_file_name_left_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable
				data.activity_image_file_name_right_column = ""; // Ignore bug in docxtemplater-image-module v.1.0.0 unstable

				next();
			},

			// Generate docx file
			function (next) {
				var imageModule = new DocxImageModule({
					centered: false,
					getImage: function (tagValue, tagName) {
						try {
							if ((tagName === 'activity_image_file_name_left_column' || tagName === 'activity_image_file_name_right_column') && tagValue) {
								// Get image binary
								var imgContent = fs.readFileSync(__dirname + '/../../../../assets/data/fcf/images/activities/' + tagValue);

								return imgContent;
							}
						}
						catch (err) {
							console.error(err);
						}
					},
					getSize: function (imgBuffer, tagValue, tagName) {
						if (imgBuffer) {
							var maxWidth = 300;
							var maxHeight = 160;

							// Find aspect ratio image dimensions
							var image = sizeOf(imgBuffer);
							var ratio = Math.min(maxWidth / image.width, maxHeight / image.height);

							return [image.width * ratio, image.height * ratio];
						}
						else {
							return [0, 0];
						}
					}
				});

				// TODO : Get file binary from database
				fs.readFile(__dirname + "/../../docx templates/activity images template.docx", "binary", function (err, content) {
					var docx = new DocxGen()
						.attachModule(imageModule)
						.load(content)
						.setData(data).render();

					resultBuffer = docx.getZip().generate({ type: "nodebuffer" });

					next();
				});
			}
		], function (err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end docxtemplate.activity_images() :::</green>');

				var buff = new Buffer(resultBuffer, 'binary');

				res.set({
					"Content-Disposition": 'attachment; filename="' + 'activity images.docx' + '"',
					"Content-Type": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					"Content-Length": buff.length
				});

				res.send(buff);

			}
		});
	}
};
