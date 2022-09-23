<%

String query = request.getQueryString();
String[] parts = request.getRequestURI().substring(request.getContextPath().length()+1).split("/");
if (parts.length<2) {
	response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
	if (parts.length==1 && parts[0].equals("CollocatesGraph")) { // handle bad URL from Hermeneutica book
		response.setHeader("Location", request.getContextPath()+"/?view=CollocatesGraph");
	} else {
		response.setHeader("Location", request.getContextPath()+"/"+(query!=null ? "?"+query : ""));
	}
	return;
}
String tool = parts[1];

// tools that need to be redirected
String redirectTool = null;
if (tool.equals("Links")) {redirectTool="CollocatesGraph";}
else if (tool.equals("CorpusGrid")) {redirectTool="Documents";}
else if (tool.equals("CorpusSummary")) {redirectTool="Summary";}
else if (tool.equals("CorpusTypeFrequenciesGrid")) {redirectTool="CorpusTerms";}
/* else if (tool.equals("DocumentInputAdd")) {redirectTool="CorpusTerms";}*/
 else if (tool.equals("DocumentTypeCollocateFrequenciesGrid")) {redirectTool="CorpusCollocates";}
else if (tool.equals("DocumentTypeFrequenciesGrid")) {redirectTool="DocumentTerms";}
else if (tool.equals("DocumentTypeKwicsGrid")) {redirectTool="Contexts";}
else if (tool.equals("TypeFrequenciesChart")) {redirectTool="Trends";}
else if (tool.equals("VisualCollocator")) {redirectTool="CollocatesGraph";}
if (redirectTool!=null) {
	response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
	response.setHeader("Location", "../"+redirectTool+"/"+(query!=null ? "?"+query : ""));
	return;
}

boolean isNotRealTool = false;
String[] notRealTools = new String[]{"Panel","VoyantFooter","VoyantHeader","VoyantTabPanel"};
for (String notRealTool : notRealTools) {
	if (notRealTool.equals(tool)) {
		isNotRealTool = true;
		break;
	}
}

boolean toolFound = false;
if (!isNotRealTool) {
	String lowerCasedFileName = tool.toLowerCase()+".js";
	
	// look in panels directory
	java.io.File panelDirectory = new java.io.File(request.getServletContext().getRealPath("app"), "panel");
	for (String file : panelDirectory.list()) {
		if (file.toLowerCase().equals(lowerCasedFileName)) {
			tool = file.substring(0,file.length()-3);
			toolFound = true;
			break;
		}
	}
	
	// look in widgets directory
	if (!toolFound) {
		java.io.File widgetDirectory = new java.io.File(request.getServletContext().getRealPath("app"), "widget");
		for (String file : widgetDirectory.list()) {
			if (file.toLowerCase().equals(lowerCasedFileName)) {
				tool = file.substring(0,file.length()-3);
				toolFound = true;
				break;
			}
		}
	}
}


// check to make sure that the indicated tool exists, otherwise redirect
if (isNotRealTool || !toolFound) {
	response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
	response.setHeader("Location", "../NoTool/?notool="+tool+(query!=null ? "&"+query : ""));
	return;
}

%>

<% request.setAttribute("title", "Voyant Tools - "+tool); %>
<%@ include file="../resources/jsp/html_head.jsp" %>
<%@ include file="../resources/jsp/head_body.jsp" %>
	
<script>
	Ext.Loader.setConfig({
		enabled : true,
		paths : {
			'Voyant' : '../../app',
			'resources': '../../resources',
			'Ext.chart': '../../resources/ext/current/chart'
		}
	});
	Ext.application({
		extend : 'Voyant.VoyantToolApp',
//		requires: ['Voyant.panel.VoyantHeader','Voyant.panel.<%= tool %>','Voyant.panel.VoyantFooter'],
		name : 'VoyantToolApp',
		config: {
			baseUrl: '<%= org.voyanttools.voyant.Voyant.getBaseUrlString(request) %>',
			version: '<%= application.getInitParameter("version") %>',
			build: '<%= application.getInitParameter("build") %>',
			tool: '<%= tool.toLowerCase() %>',
			allowInput: '<%= System.getProperty("org.voyanttools.server.allowinput")==null ? "" : System.getProperty("org.voyanttools.server.allowinput") %>',
			entitiesEnabled: <%= application.getInitParameter("entitiesenabled") %>
		},
		launch: function() {
			if (document.location.search.length==0) {
				var url = "../../?view=<%= tool %>";
				if (document.location.search) {
					url+="&"+document.location.search.substring(1)
				}
				window.location.replace(url)
			} else {
				this.callParent(arguments);
			}
		}
	});
	
</script>

</body>
</html>