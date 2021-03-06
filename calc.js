function calc_update(mb, mp, tar, tba, nozzleMass) {
		var mp_set = 1;
		// if (typeof mb !== "undefined" && mb !== null)
		// 	mp_set = 1;
		var tar_set = 1;
		var tba_set = 0;
		if(sanity_check_inputs(mb, mp, mp_set, tar, tba, tar_set, tba_set))
			return;

		// Get constants and check them
		var rho_g = 0.1786; 		//density of gas (helium)
		//find_rho_g();
		var rho_a = 1.2050; 		//density of air
		//get_value('rho_a');
		var adm = 7238.3; 			//air density model
		//get_value('adm');
		var ga = 9.80665; 			//accel due to gravity
		//get_value('ga');
		var bd = find_bd(mb);		//balloon diameter
		var cd = find_cd(mb);		//balloon @wtf is this?

		if(sanity_check_constants(rho_g, rho_a, adm, ga, bd, cd))
			return;

		// Do some maths
		mb = parseFloat(mb.substr(1)) / 1000.0;
		mp = mp / 1000.0;

		var ascent_rate = 0;
		var burst_altitude = 0;
		var time_to_burst = 0;
		var neck_lift = 0;
		var launch_radius = 0;
		var launch_volume = 0;

		//4/3 * pi *(bd/2)^3 (bd = burst diameter)
		var burst_volume = (4.0/3.0) * Math.PI * Math.pow(bd / 2.0, 3); 

		if(tba_set) {
			launch_volume = burst_volume * Math.exp((-tba) / adm);
			launch_radius = Math.pow((3*launch_volume)/(4*Math.PI), (1/3));
		} else if(tar_set) {
			var a = ga * (rho_a - rho_g) * (4.0 / 3.0) * Math.PI;
			var b = -0.5 * Math.pow(tar, 2) * cd * rho_a * Math.PI;
			var c = 0;
			var d = - (mp + mb) * ga;

			var f = (((3*c)/a) - (Math.pow(b, 2) / Math.pow(a,2)) / 3.0);
			var g = (
				((2*Math.pow(b,3))/Math.pow(a,3)) -
				((9*b*c)/(Math.pow(a,2))) + ((27*d)/a) / 27.0
			);
			var h = (Math.pow(g,2) / 4.0) + (Math.pow(f,3) / 27.0);

			if(h>0) {
				// One real root. This is what should happen.
				var R = (-0.5 * g) + Math.sqrt(h);
				var S = Math.pow(R, 1.0/3.0);
				var T = (-0.5 * g) - Math.sqrt(h);
				var U = Math.pow(T, 1.0/3.0);
				launch_radius = (S+U) - (b/(3*a));
			} else if(f==0 && g==0 && h==0) {
				// Three real and equal roots
				// Will this ever even happen?
				launch_radius = -1 * Math.pow(d/a, 1.0/3.0);
			} else if(h <= 0) {
				// Three real and different roots
				// What the hell do we do?!
				// It needs trig! fffff
				var i = Math.sqrt((Math.pow(g,2)/4.0) - h);
				var j = Math.pow(i, 1.0/3.0);
				var k = Math.acos(-g / (2*i));
				var L = -1 * j;
				var M = Math.cos(K/3.0);
				var N = Math.sqrt(3) * Math.sin(K/3.0);
				var P = (b/(3*a)) * -1;
				var r1 = 2*j*Math.cos(k/3.0) - (b/(3*a));
				var r2 = L * (M + N) + P;
				var r3 = L * (M - N) + P;

				alert("Three possible solutions found: "
					+ r1 + ", " + r2 + ", " + r3);

				if(r1 > 0) {
					launch_radius = r1;
				} else if(r2 > 0) {
					launch_radius = r2;
				} else if(r3 > 0) {
					launch_radius = r3;
				}
			} else {
				alert("No Real Roots. Try a different configuration.");
				// No real roots
			}
		}

		var launch_area = Math.PI * Math.pow(launch_radius, 2);
		var launch_volume = (4.0/3.0) * Math.PI * Math.pow(launch_radius, 3);
		var density_difference = rho_a - rho_g;
		var gross_lift = launch_volume * density_difference;
		neck_lift = (gross_lift - mb) * 1000;
		var total_mass = mp + mb;
		var free_lift = (gross_lift - total_mass) * ga;
		ascent_rate = Math.sqrt(free_lift / (0.5 * cd * launch_area * rho_a));
		var volume_ratio = launch_volume / burst_volume;
		burst_altitude = -(adm) * Math.log(volume_ratio);
		time_to_burst = (burst_altitude / ascent_rate) / 60.0;

		if(isNaN(ascent_rate)) {
			set_error('tba', "Altitude unreachable for this configuration.");
			return;
		}

		if(bd >= 10 && ascent_rate < 4.8) {
			set_warning('floater', "configuration suggests a possible floater");
		}
		burst_alt_ft = burst_altitude* 3.2808;

		ascent_rate 		= ascent_rate.toFixed(2);
		burst_altitude 	= burst_altitude.toFixed();
		burst_alt_ft 		= burst_alt_ft.toFixed();
		time_to_burst 	= time_to_burst.toFixed();
		neck_lift 			= nl = neck_lift.toFixed();
		launch_litres 	= (launch_volume * 1000).toFixed();
		launch_cf 			= (launch_volume * 35.31).toFixed(1);
		launch_volume 	= launch_volume.toFixed(2);

		ascent_rate 		= ascent_rate + " m/s";
		burst_altitude 	= burst_altitude + " m";
		burst_alt_ft		= burst_alt_ft + " ft";
		time_to_burst 	= time_to_burst + " min";
		neck_lift 			= neck_lift + " g";
		offset 					= nl-nozzleMass + " g";
		launch_volume 	= launch_volume + " m<sup>3</sup>";
		launch_litres 	= launch_litres + " L";
		launch_cf 			= launch_cf + " ft<sup>3</sup>";


		var ret = {
			  ascent_rate: 		ascent_rate
			, burst_altitude: burst_altitude
			, burst_alt_ft: 	burst_alt_ft
			, time_to_burst: 	time_to_burst
			, neck_lift: 			neck_lift
			, offset: 				offset
			, launch_volume: 	launch_volume
			, launch_litres: 	launch_litres
			, launch_cf: 			launch_cf
		};
		return ret;
}
//errors are fatal
function set_error(id, text) {
	//alert("ERROR: "+id+": "+text);
	$("#errors").append("<li>"+"ERROR: "+text+"</li>");
}

//warnings are not fatal
function set_warning(id, text) {
	$("#errors").append("<li>"+"WARN: "+text+"</li>");	
}

function clear_errors() {
	$("#errors").html("");
}

//Find Balloon Diameter
function find_bd(mb) {
	var bds = new Array();

	// From Kaymont Totex Sounding Balloon Data
	bds["k200"] = 3.00;
	bds["k300"] = 3.78;
	bds["k350"] = 4.12;
	bds["k450"] = 4.72;
	bds["k500"] = 4.99;
	bds["k600"] = 6.02;
	bds["k700"] = 6.53;
	bds["k800"] = 7.00;
	bds["k1000"] = 7.86;
	bds["k1200"] = 8.63;
	bds["k1500"] = 9.44;
	bds["k2000"] = 10.54;
	bds["k3000"] = 13.00;
	// Hwoyee data from http://www.hwoyee.com/base.asp?ScClassid=521&id=521102
	bds["h200"] = 3.00;
	bds["h300"] = 3.80;
	bds["h350"] = 4.10;
	bds["h400"] = 4.50;
	bds["h500"] = 5.00;
	bds["h600"] = 5.80;
	bds["h750"] = 6.50;
	bds["h800"] = 6.80;
	bds["h950"] = 7.20;
	bds["h1000"] = 7.50;
	bds["h1200"] = 8.50;
	bds["h1500"] = 9.50;
	bds["h1600"] = 10.50;
	bds["h2000"] = 11.00;
	// PAWAN data from
	// https://sites.google.com/site/balloonnewswebstore/1200g-balloon-data
	bds["p1200"] = 8.0;

	var bd;

	//@wtf is the parameter even for then if you are gonna do this
	//if($('#bd_c:checked').length) bd = get_value('bd');
	//else bd = bds[$('#mb').val()];

	return bds[mb];
}
//@question, What is Cd?
function find_cd(mb) {
	var cds = new Array();

	// From Kaymont Totex Sounding Balloon Data
	cds["k200"] = 0.25;
	cds["k300"] = 0.25;
	cds["k350"] = 0.25;
	cds["k450"] = 0.25;
	cds["k500"] = 0.25;
	cds["k600"] = 0.30;
	cds["k700"] = 0.30;
	cds["k800"] = 0.30;
	cds["k1000"] = 0.30;
	cds["k1200"] = 0.25;
	cds["k1500"] = 0.25;
	cds["k2000"] = 0.25;
	cds["k3000"] = 0.25;
	// Hwoyee data just guesswork
	cds["h200"] = 0.25;
	cds["h300"] = 0.25;
	cds["h350"] = 0.25;
	cds["h400"] = 0.25;
	cds["h500"] = 0.25;
	cds["h600"] = 0.30;
	cds["h750"] = 0.30;
	cds["h800"] = 0.30;
	cds["h950"] = 0.30;
	cds["h1000"] = 0.30;
	cds["h1200"] = 0.25;
	cds["h1500"] = 0.25;
	cds["h1600"] = 0.25;
	cds["h2000"] = 0.25;
	// PAWAN data also guesswork
	cds["p1200"] = 0.25;

	var cd;
	//@wtf is the parameter even for then if you are gonna do this
	// if($('#cd_c:checked').length) cd = get_value('cd');
	// else cd = cds[$('#mb').val()];
	return cds[mb];
}
function sanity_check_inputs(mb, mp, mp_set, tar, tba, tar_set, tba_set) {
  if(tar_set && tba_set) {
      set_error('tar', "Specify either target burst altitude or target ascent rate!");
      set_error('tba', "Specify either target burst altitude or target ascent rate!");
      return 1;
  } else if(!tar_set && !tba_set) {
      set_error('tar', "Must specify at least one target!");
      set_error('tba', "Must specify at least one target!");
      return 1;
  }

  if(tar_set && tar < 0) {
      set_error('tar', "Target ascent rate can't be negative!");
      return 1;
  } else if(tar_set && tar > 10) {
      set_error('tar', "Target ascent rate is too large! (more than 10m/s)");
      return 1;
  }

  if(tba_set && tba < 10000) {
      set_error('tba', "Target burst altitude is too low! (less than 10km)");
      return 1;
  } else if(tba_set && tba > 40000) {
      set_error('tba',
          "Target burst altitude is too high! (greater than 40km)");
      return 1;
  }

  if(!mp_set) {
      set_error('mp', "You have to enter a payload mass!");
      return 1;
  } else if(mp < 20) {
      set_error('mp', "Mass is too small! (less than 20g)");
      return 1;
  } else if(mp > 5000) {
      set_error('mp', "Mass is too large! (over 5kg)");
      return 1;
  }

  return 0;
}

function sanity_check_constants(rho_g, rho_a, adm, ga, bd, cd) {
  if(!rho_a || rho_a < 0) {
      //show_error('rho_a');
      return 1;
  }
  if(!rho_g || rho_g < 0 || rho_g > rho_a) {
      //show_error('rho_g');
      return 1;
  }
  if(!adm || adm < 0) {
      //show_error('adm');
      return 1;
  }
  if(!ga || ga < 0) {
      //show_error('ga');
      return 1;
  }
  if(!cd || cd < 0 || cd > 1) {
      //show_error('cd');
      return 1;
  }
  if(!bd || bd < 0) {
      //show_error('bd');
      return 1;
  }

  return 0;
}

function gen_table(targets, balloon, payloadWeight, nozzleMass) {
	var table = "";

	var headers = {
		"Ascent Rate"			:{},
		"Burst Altitude"	:{colspan:2, title:"Altitude when the balloon will burst."},
		"Time To Burst"		:{},
		"Neck Lift"				:{title:"The amont of lift needed at the neck of the balloon."},
		"Offset"					:{title:"Lift at the neck less the Nozzle mass. We use this to calculate th weight of the water jug."},
		"Launch Volume"		:{colspan:3,title:"Amount of gas needed at ground level."},
	}
	table += "<table border=1>";
	table += "<tr>";
	for(var h in headers){
		table += "<th ";
		for(var a in headers[h]) {
			table += a+"=\""+headers[h][a]+"\" ";
		}
    table += ">";
    table += h + "</th>";
	}
	table += "</tr>";

	for(var tar in targets){
    var ret = calc_update(balloon, payloadWeight, targets[tar], 0, nozzleMass);
		table += "<tr>";
		for(var prop in ret){
	    table += "<td>" + ret[prop] + "</td>";
		}
		table += "</tr>";
	}

	table += "</table>";
	return table;
}