<template>
<div>
  <div class="buttons">
    <div>
      <h3> Chlorophyll Data</h3>
    </div>
    <div class="toggles">
      <div>
        <ToggleButton id="whiteLEDS_button" v-bind:currentState="whiteLEDS_active" labelEnableText="White LEDs On" labelDisableText="White LEDs Off" v-on:change="toggle_whiteLEDS()"/>
      </div>

      <div>
        <ToggleButton id="UVLED_button" v-bind:currentState="UVLED_active" labelEnableText="UV LEDs On" labelDisableText="UV LEDs Off" v-on:change="toggle_UVLED()"/>
      </div>
    </div>
  </div>
  <br>
  <div class="wrap-table">
    <div>
        <h3> Chlorophyll Spectral data </h3>
    </div>
    <table class="tableFormat" style="undefined;table-layout: fixed; width: 434px">
    <colgroup>
      <col style="width: 63px">
      <col style="width: 53px">
      <col style="width: 53px">
      <col style="width: 53px">
      <col style="width: 53px">
      <col style="width: 53px">
      <col style="width: 53px">
      <col style="width: 53px">
    </colgroup>
    <thead>
      <tr>
        <th class = "tableElement"></th>
        <th class = "tableElement">1</th>
        <th class = "tableElement">2</th>
        <th class = "tableElement">3</th>
        <th class = "tableElement">4</th>
        <th class = "tableElement">5</th>
        <th class = "tableElement">6</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class = "tableElement">Spec 0</td>
        <td class = "tableElement">{{ spectral_data.d0_1.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d0_2.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d0_3.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d0_4.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d0_5.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d0_6.toFixed(0) }}</td>
      </tr>
      <tr>
        <td class = "tableElement">Spec 1</td>
        <td class = "tableElement">{{ spectral_data.d1_1.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d1_2.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d1_3.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d1_4.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d1_5.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d1_6.toFixed(0) }}</td>
      </tr>
      <tr>
        <td class = "tableElement">Spec 2</td>
        <td class = "tableElement">{{ spectral_data.d2_1.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d2_2.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d2_3.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d2_4.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d2_5.toFixed(0) }}</td>
        <td class = "tableElement">{{ spectral_data.d2_6.toFixed(0) }}</td>
      </tr>
    </tbody>
    </table>
  </div>
  <GenerateReport v-bind:spectral_data="spectral_data"/>
</div>
</template>

<script>
import GenerateReport from './GenerateReport.vue';
import ToggleButton from './ToggleButton.vue';

export default {
  data () {
    return {
      whiteLEDS_active: false,
      UVLED_active: false
    }
  },
  props: {
    mosfetIDs: {
      type: Object,
      required: true
    },
    spectral_data: {
      type: Object,
      required: true
    }
  },  
  methods: {
    toggle_whiteLEDS: function () {
      this.whiteLEDS_active = !this.whiteLEDS_active
      this.setPart(this.mosfetIDs.white_led, this.whiteLEDS_active)
    },

    toggle_UVLED: function () {
      this.UVLED_active = !this.UVLED_active
      this.setPart(this.mosfetIDs.uv_led, this.UVLED_active)
    },
    
    setPart: function(id, enabled) {
      this.$parent.publish("/mosfet_cmd", {
        'type': 'MosfetCmd',
        'device': id,
        'enable': enabled
      })
    }
  },
  components: {
    GenerateReport,
    ToggleButton
  }
}
</script>

<style scoped>
  .buttons {
    display: inline-block;
    align-content: center;
    height: 10vh;
  }

  .wrap-table {
    display: inline-block;
    align-content: center;
    height: max-content;
    padding-bottom: 5px;
  }

  .report {
    height: 5vh;
    align-items: center;
    padding-top: 3vh;
  }

  .tableFormat{
    border-collapse:collapse;
    border-spacing:0;
  }

  .tableFormat td{
    border-color:black;
    border-style:solid;
    border-width:1px;
    font-size:14px;
    overflow:hidden;
    padding:5px 5px;
    word-break:normal
  }

  .tableFormat th{
    border-color:black;
    border-style:solid;
    border-width:1px;
    font-size:14px;
    font-weight:normal;
    overflow:hidden;
    padding:10px 5px;
    word-break:normal;
  }

  .tableFormat .tableElement{
    border-color:inherit;
    text-align:center;
    vertical-align:top
  }

  .toggles {
    display: flex;
  }

</style>

