const chai = require('chai')
const expect = chai.expect

const DataGenerator = require('../DataGenerator.js')


describe('#inventoryTest()', function() {
    
    function findHostByName(hosts, hostname) {
        return hosts.find(h => h.name == hostname)
    }

    var inventoryFile = "./inventory.conf"
    var data ={}

    before(function() {
        data = DataGenerator.parseInventoriesAndGenerateData(inventoryFile)
    })
  
    it('check flat host list', function() {
        const hostCount = 32
        expect(data).property('hosts')
        expect(data['hosts'].length).to.equal(hostCount)
    })

    it('check flat group list', function() {
        const groupCount = 36
        expect(data).property('groups')
        expect(data['groups'].length).to.equal(groupCount)
    })

    it('check inventories', function() {
        const inventoryCount = 5

        var inventories = data['hosts'].map(h => h.inventory).filter((v, i, a) => a.indexOf(v) === i)
        expect(inventories.length).to.equal(inventoryCount)

        var inventories = data['groups'].map(h => h.inventory).filter((v, i, a) => a.indexOf(v) === i)
        expect(inventories.length).to.equal(inventoryCount)
    })

    it('check hosts for inventory1', function() {
        const hostCount = 9
        var hosts = data['hosts'].filter(h => h.inventory == 'inventory1')
        expect(hosts.length).to.equal(hostCount)

        const hostnames = ['leaf01','leaf02','spine01','spine01','webserver01','webserver02','localhost','other1.example.com','other2.example.com']
        for(var i in hostnames) {
            var host = findHostByName(hosts, hostnames[i])
            expect( host ).not.undefined
            
            expect( host ).property('environment_label')
            expect( host.environment_label ).to.equal('env1')

            expect( host ).property('inventory')
            expect( host.inventory ).to.equal('inventory1')

            expect( hosts.map(h => h.name).includes(hostnames[i]) ).to.be.true
        }

        var host = findHostByName(hosts, 'localhost')
        expect( Object.keys( host.variables).length ).to.equal(1)
        expect( host.variables['ansible_connection'] ).to.equal('local')

        host = findHostByName(hosts, 'other1.example.com')
        expect( Object.keys( host.variables).length ).to.equal(2)
        expect( host.variables['ansible_connection'] ).to.equal('ssh')
        expect( host.variables['ansible_user'] ).to.equal('myuser')

        host = findHostByName(hosts, 'other2.example.com')
        expect( Object.keys( host.variables).length ).to.equal(2)
        expect( host.variables['ansible_connection'] ).to.equal('ssh')
        expect( host.variables['ansible_user'] ).to.equal('myotheruser')

        const hostsWithoutVariables = ['leaf01','leaf02','spine01','spine01','webserver01','webserver02']
        for(var i in hostsWithoutVariables) {
            host = findHostByName(hosts, hostsWithoutVariables[i])
            expect( Object.keys( host.variables ).length ).to.equal(0)
        }

    })

    it('check groups for inventory1', function() {
        const groupCount = 8
        var groups = data['groups'].filter(h => h.inventory == 'inventory1')
        expect(groups.length).to.equal(groupCount)

        const groupnames = ['ungrouped','leafs','spines','network','webservers','datacenter','test','all']
        expect( groupnames.length ).to.equal(groupCount)
        for(var i in groupnames) {
            expect( groups.map(g => g.name).includes(groupnames[i]) ).to.be.true
        }

        const emptySubgroups = ['ungrouped','leafs','spines','webservers','test']
        for(var i in emptySubgroups) {
            expect( groups.find(g => g.name == emptySubgroups[i]).subgroups.length ).to.equal(0)
        }

        const parentGroups = ['all','datacenter','network']
        for(var i in parentGroups) {
            expect( groups.find(g => g.name == parentGroups[i]).subgroups.length ).greaterThan(0)
        }

        expect( emptySubgroups.length + parentGroups.length ).to.equal(groupCount)
    })
})