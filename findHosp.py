import googlemaps, datetime, sys, numpy as np, math, linecache
from googlemaps import places

R = 6371e3 #meters
def locDist(lat1,lng1,lat2,lng2):
    """
    Calculate distance between two points on a sphere (now with fixed Earth radius)i
    using the Haversine formula
    """
    phi1,phi2 = np.radians(lat1),np.radians(lat2)
    dPhi = np.radians(lat2 - lat1)
    dLam = np.radians(lng2 - lng1)
    a = np.sin(dPhi/2.)*np.sin(dPhi/2.) + np.cos(phi1)*np.cos(phi2)*np.power(np.sin(dLam/2.),2)
    c = 2.*math.atan2(np.sqrt(a),np.sqrt(1-a))
    return R*c

placename = sys.argv[1:]
placename = ' '.join(placename)

#hacky
API_KEY='AIzaSyDjiQzmok7xWQPpw6qplpanT9LQLKmWYQc'
gmaps = googlemaps.Client(key=API_KEY)

g_r = gmaps.geocode(placename)
lat = g_r[0]['geometry']['location']['lat']
lng = g_r[0]['geometry']['location']['lng']

rad = 1000 #meters
finds = places.places(gmaps,'hospital',location={'lat':lat,'lng':lng},radius=rad)
#finds = places.places_nearby(gmaps,{'lat':lat,'lng':lng},radius=1)

while finds['status']=='ZERO_RESULTS':
    rad*=10
    #print 'No results, increasing radius. Radius=%i km'%(rad/1000)
    finds = places.places(gmaps,'hospital',location={'lat':lat,'lng':lng},radius=rad)

stor = []
for i,result in enumerate(finds['results']):
    #if not 'hospital' in result['types']: continue
    name = result['name']
    add =result['formatted_address']
    loc = result['geometry']['location']
    lat_t,lng_t = loc['lat'],loc['lng']
    d = locDist(lat,lng,lat_t,lng_t)
    stor.append((name,add,d,lat_t,lng_t))
sbd = sorted(stor,key=lambda tup: tup[2])
hsp = sbd[0]
#patient location
print lat
print lng
#nearest hospital location
print hsp[3]
print hsp[4]
#hospital address
if hsp[2]/1000. < 1.: fragment = '%i m away.'%(int(hsp[2]))
else: fragment = '%.1f km away.'%round(hsp[2]/1000.,1)
ss = 'Your nearest clinic is "%s %s", '%(hsp[0],hsp[1])
ss+=fragment
print ss
