"""One-time schema migration for the Analyst 1.2 feature contract."""
import copy,json
from pathlib import Path
p=Path('lib/mcp/plugin/contracts.json'); c=json.loads(p.read_text())
assert c['contract_version']=='1.1.0', 'This one-time migration requires the original 1.1.0 contract'
num={'anyOf':[{'type':'number'},{'type':'null'}]}; integer={'type':'integer','minimum':0}; text={'type':'string'}; nullable_text={'anyOf':[text,{'type':'null'}]}
metrics=['yield','leverage','velocity','snr','construction','dev10x','scale_v']; tokens=['input','output','cache_write','cache_read','total']
def obj(props,required=None):return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}
def ref(n):return {'$ref':'#/$defs/'+n}
def data_of(t):return t['outputSchema']['properties']['data']['anyOf'][0]
def setdata(t,d):
 t['outputSchema']['properties']['data']['anyOf'][0]=copy.deepcopy(d)
 t['outputSchema']['allOf'][0]['then']['properties']['data']=copy.deepcopy(d)
coverage=obj({'earliest_snapshot':nullable_text,'latest_snapshot':nullable_text,'missing_snapshot_dates':integer,'common_period':nullable_text,'periods_aligned':{'type':'boolean'}})
sorts={'type':'string','enum':metrics+tokens,'default':'yield'}
order={'type':'string','enum':['asc','desc'],'default':'desc'}
for t in c['tools']:
 o=t['outputSchema']
 o['properties']['contract_version']={'const':'1.2.0'}
 if t['name']=='report_beta_bug':continue
 props=t['inputSchema']['properties']
 props['window']['default']='all'
 props['view']['default']='total'
 props['dataset']={'type':'string','enum':['live'],'default':'live','description':'Live database field only. Use get_historical_board for July 2026.'}
 defs=o['$defs'];defs['scope']['properties']['dataset']={'const':'live'};defs['scope']['required'].append('dataset')
 defs['operator']['properties']['position']={'type':'integer','minimum':1}
 dist=defs['distribution'];dist['properties'].update({'mean':num,'p95':num,'missing_count':integer,'zero_count':integer});dist['required']+=['mean','p95','missing_count','zero_count']
 d=data_of(t)
 if t['name']=='get_leaderboard':
  props['sort_by']=sorts;props['order']=order
  props['cursor']={'anyOf':[{'type':'string','maxLength':1024},{'type':'null'}],'description':'Returned next_cursor, bound to scope, metric, order and unchanged field.'}
  d['properties']['sort_metric']={'type':'string','enum':metrics+tokens};d['properties']['sort_order']=order;d['required'].append('sort_order')
  t['description']='Explore the live SignalAF board, defaulting to claimed operators, Total / All-time. Sort by Yield, operating-ratio components or raw input/output/cache/total token counts, ascending or descending. Sorting covers the full selected field before bounded pagination; null values sort last. rank preserves published placement; position follows the requested sort. Use next_cursor for remaining rows. Non-compounding Yield/Leverage/10xDEV are unavailable under published board rules. Historical data uses get_historical_board.'
 if t['name']=='get_field_stats':
  d['properties']['token_distributions']=obj({m:ref('distribution') for m in tokens})
  d['properties']['snapshot_coverage']=coverage;d['required']+=['token_distributions','snapshot_coverage']
  t['description']='Benchmark the full live selected field, defaulting to claimed operators, Total / All-time, matching get_leaderboard. Returns token and derived-metric means, medians, quartiles, p95, extrema, sample sizes, zeros and missingness. Counts describe selected aggregate snapshots, not per-day use. Platform and historical comparisons have dedicated tools. Measurement verification is not inferred.'
 setdata(t,d)
base=next(t for t in c['tools'] if t['name']=='get_field_stats')
t=copy.deepcopy(base);t['name']='get_platform_stats';t['title']='Compare Platform Token Statistics';t['description']='Compare live platform groups using one selected snapshot per operator-platform. Defaults to claimed operators and all-time; view=platforms includes unclaimed public operators. Returns per-platform token and metric distributions, sample sizes, shared-period coverage and overlapping-operator counts. Groups may overlap and observation periods may differ; this is not causal platform performance or a count of unique people across groups.'
t['inputSchema']['properties']={k:v for k,v in t['inputSchema']['properties'].items() if k in ['window','view','cohort','platform','dataset']}
group=obj({'platform':text,'population_size':integer,**coverage['properties'],'distributions':obj({m:ref('distribution') for m in metrics}),'token_distributions':obj({m:ref('distribution') for m in tokens})})
setdata(t,obj({'scope':ref('scope'),'denominator':{'const':'operator_platform_records'},'record_count':integer,'unique_operator_count':integer,'overlapping_operators':integer,'groups':{'type':'array','items':group}})); c['tools'].insert(-1,t)
t=copy.deepcopy(base);t['name']='get_historical_board';t['title']='Explore the Frozen July 2026 Board';t['description']='Explore only the frozen July 31, 2026 proof-of-concept board, separate from live data. Returns source composition/date/version, full-field token and metric statistics plus bounded chart-ready rows. Sort metrics in either direction, paginate, filter platform or request up to ten archive codenames. rank is the original archive placement; position is the requested sort. The original classification is preserved. No live database is read.'
t['inputSchema']=obj({'dataset':{'type':'string','enum':['july_2026'],'default':'july_2026'},'platform':{'type':'string','pattern':'^[a-z0-9][a-z0-9-]{0,63}$','default':'all'},'sort_by':sorts,'order':order,'limit':{'type':'integer','minimum':1,'maximum':100,'default':25},'cursor':{'anyOf':[{'type':'string','maxLength':1024},{'type':'null'}]},'codenames':{'type':'array','minItems':1,'maxItems':10,'items':{'type':'string','pattern':'^[a-zA-Z0-9_-]{1,128}$'}}},[])
entry=obj({'codename':text,'display_name':text,'rank':integer,'position':{'type':'integer','minimum':1},'platform':text,'source_label':{'enum':['seeded','recorded_real','unknown']},'class_tier':text,'operating_ratio':nullable_text,'pillars':ref('pillars'),'metrics':ref('metrics')})
archive=obj({'generatedAt':text,'window':{'const':'all_time'},'totalOperators':integer,'sourceCommit':text,'gitBlob':text,'seeded':integer,'real':integer})
setdata(t,obj({'scope':obj({'dataset':{'const':'july_2026'},'platform':text,'snapshot_at':text}),'archive':archive,'population_size':integer,'distributions':obj({m:ref('distribution') for m in metrics}),'token_distributions':obj({m:ref('distribution') for m in tokens}),'entries':{'type':'array','maxItems':100,'items':entry},'returned_count':integer,'next_cursor':nullable_text,'sort_metric':{'enum':metrics+tokens},'sort_order':order,'board_url':text}))
t['outputSchema']['properties']['provenance']={'anyOf':[obj({'source_urls':{'type':'array','items':text},'retrieved_at':text,'observed_at':text,'dataset_version':text,'data_origin':{'const':'frozen_reference_snapshot'}}),{'type':'null'}]}
t['outputSchema']['$defs']['provenance']=copy.deepcopy(t['outputSchema']['properties']['provenance']['anyOf'][0])
for tool in [*c['tools'], t]: tool['annotations']['title']=tool['title']
platform_tool=next(tool for tool in c['tools'] if tool['name']=='get_platform_stats')
platform_data=data_of(platform_tool);platform_data['properties'].update(coverage['properties']);platform_data['required']+=list(coverage['properties']);setdata(platform_tool,platform_data)
c['tools'].insert(-1,t);c['contract_version']='1.2.0';c['status']='implemented_field_benchmarks_and_frozen_archive'
p.write_text(json.dumps(c,indent=2)+'\n')
