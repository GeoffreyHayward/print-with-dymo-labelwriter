function PrinterViewModel() {

	// DYMO Environment
	this.browserSupported = ko.observable(false);
	this.frameworkInstalled = ko.observable(false);
	this.webServicePresent = ko.observable(false);
	this.environmentChecked = ko.observable(false);
	this.environmentStable = ko.computed(function () {
		return (this.browserSupported() && this.frameworkInstalled() && this.webServicePresent());
	}, this, {pure: true});

	// DYMO Printer
	this.printerName = ko.observable("");
	this.printerConnected = ko.observable(false);
	this.printerChecked = ko.observable(false);

	// DYMO label
	this.lebelAjaxComplete = ko.observable(false);
	this.lebelajaxResponseCode = ko.observable(-1);
	this.lebelaAcquired = ko.computed(function () {
		return (this.lebelajaxResponseCode() >= 200 && this.lebelajaxResponseCode() < 300);
	}, this, {pure: true});


	// UI Message
	this.message = ko.observable("Loading");
	this.state = ko.computed(function () {
		if (!this.environmentChecked() || !this.printerChecked() || !this.lebelAjaxComplete()) {
			this.message("Loading");
		} else if (this.environmentStable() && this.printerConnected() && this.lebelaAcquired()) {
			this.message("Ready");
		} else {
			if (!this.printerConnected()) {
				this.message("Not connected")
			} else {
				this.message("Error");
			}
		}
	}, this);
}

var printerViewModel = new PrinterViewModel();
var shippingLabelTemplate;

$(function () {
	ko.applyBindings(printerViewModel);
	dymo.label.framework.init(dymoLoad);
});

function dymoLoad() {
	dymoEnvironment();
	dymoPrinter();
	dymoTemplate();
}

function dymoEnvironment() {
	var result = dymo.label.framework.checkEnvironment();
	printerViewModel.browserSupported(result.isBrowserSupported);
	printerViewModel.frameworkInstalled(result.isFrameworkInstalled);
	printerViewModel.webServicePresent(result.isWebServicePresent);
	printerViewModel.environmentChecked(true);
}

function dymoPrinter() {
	try {
		dymo.label.framework.getPrintersAsync().then(function (printers) {
			if (printers.length >= 1) {
				printerViewModel.printerName(printers[0].name);
				printerViewModel.printerConnected(printers[0].isConnected);
			}
			printerViewModel.printerChecked(true);
		});
	} catch (err) {
		printerViewModel.message(err.message);
	}
}

function dymoTemplate() {
	$.ajax({
		url: "shipping.label",
		dataType: "text"
	}).then(function (data, textStatus, jqXHR) {
		shippingLabelTemplate = data;
		printerViewModel.lebelajaxResponseCode(jqXHR.status);
		printerViewModel.lebelAjaxComplete(true);
	});
}

function dymoPrint() {
	printerViewModel.message("Spooling");
	var label = dymo.label.framework.openLabelXml(shippingLabelTemplate);
	label.setObjectText('TEXT', document.getElementById("address-box").value);
	label.printAsync(printerViewModel.printerName()).then(function (state) {
		if (state) {
			printerViewModel.message("Printing");
			setTimeout(function () {
				printerViewModel.message("Ready");
			}, 2000);
		} else {
			printerViewModel.message("Error");
		}
	});
	return false;
}
