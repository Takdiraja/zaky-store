package id.zakystore.app;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

/**
 * Plugin native untuk printer thermal via Bluetooth Classic (SPP).
 *
 * Kenapa native, bukan Web Bluetooth: navigator.bluetooth TIDAK tersedia
 * di Android WebView (hanya di browser Chrome). Jadi di APK, koneksi printer
 * harus lewat socket RFCOMM SPP langsung dari Java.
 *
 * Method:
 * - listPairedDevices(): daftar printer yang sudah di-pair
 * - connect({address}): konek via SPP socket
 * - print({data}): kirim bytes ESC/POS (base64)
 * - disconnect(), isConnected()
 *
 * Permission BLUETOOTH_SCAN + BLUETOOTH_CONNECT diminta otomatis via
 * dialog sistem Android saat method dipanggil.
 */
@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "connect"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_SCAN }, alias = "scan")
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    private static final String TAG = "BTPrinter";
    private static final UUID SPP_UUID =
        UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothSocket socket;
    private OutputStream outputStream;
    private String connectedDeviceName;

    @PluginMethod
    public void listPairedDevices(PluginCall call) {
        if (!hasPermission()) {
            requestAllPermissions(call, "permsCallback");
            return;
        }
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Bluetooth tidak tersedia di HP ini");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("Bluetooth mati. Nyalakan dulu di pengaturan HP.");
            return;
        }
        try {
            Set<BluetoothDevice> paired = adapter.getBondedDevices();
            JSArray devices = new JSArray();
            for (BluetoothDevice d : paired) {
                JSObject o = new JSObject();
                o.put("name", d.getName());
                o.put("address", d.getAddress());
                devices.put(o);
            }
            JSObject ret = new JSObject();
            ret.put("devices", devices);
            call.resolve(ret);
        } catch (SecurityException e) {
            call.reject("Izin Bluetooth ditolak: " + e.getMessage());
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        if (!hasPermission()) {
            requestAllPermissions(call, "permsCallback");
            return;
        }
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("address (MAC) wajib diisi");
            return;
        }
        disconnectInternal();

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth tidak tersedia atau mati");
            return;
        }
        try {
            BluetoothDevice device = adapter.getRemoteDevice(address);
            adapter.cancelDiscovery();
            socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
            socket.connect();
            outputStream = socket.getOutputStream();
            connectedDeviceName = device.getName();

            JSObject ret = new JSObject();
            ret.put("connected", true);
            ret.put("deviceName", connectedDeviceName);
            ret.put("address", address);
            call.resolve(ret);
            Log.i(TAG, "Connected to " + connectedDeviceName);
        } catch (SecurityException e) {
            call.reject("Izin Bluetooth ditolak: " + e.getMessage());
        } catch (IOException e) {
            Log.e(TAG, "Connect failed", e);
            call.reject("Gagal konek ke printer. Pastikan printer NYALA dan sudah di-pair di pengaturan Bluetooth HP.");
        }
    }

    @PluginMethod
    public void print(PluginCall call) {
        if (outputStream == null || socket == null || !socket.isConnected()) {
            call.reject("Belum konek ke printer. Konek dulu.");
            return;
        }
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("data (base64) wajib diisi");
            return;
        }
        try {
            byte[] bytes = android.util.Base64.decode(data, android.util.Base64.DEFAULT);
            outputStream.write(bytes);
            outputStream.flush();
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("bytesWritten", bytes.length);
            call.resolve(ret);
        } catch (IOException e) {
            Log.e(TAG, "Print failed", e);
            disconnectInternal();
            call.reject("Gagal print. Printer mungkin putus — coba konek ulang.");
        } catch (IllegalArgumentException e) {
            call.reject("Data base64 tidak valid");
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal();
        JSObject ret = new JSObject();
        ret.put("disconnected", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        boolean connected = socket != null && socket.isConnected() && outputStream != null;
        JSObject ret = new JSObject();
        ret.put("connected", connected);
        ret.put("deviceName", connected ? connectedDeviceName : null);
        call.resolve(ret);
    }

    @PermissionCallback
    private void permsCallback(PluginCall call) {
        if (call == null) return;
        if (!hasPermission()) {
            call.reject("Izin Bluetooth ditolak. Aktifkan di Pengaturan > Aplikasi > ZAKY STORE > Izin.");
            return;
        }
        // Ulangi method yang tadi tertunda izin
        String method = call.getMethodName();
        if ("listPairedDevices".equals(method)) listPairedDevices(call);
        else if ("connect".equals(method)) connect(call);
        else call.resolve();
    }

    private void disconnectInternal() {
        try { if (outputStream != null) outputStream.close(); } catch (IOException ignored) {}
        try { if (socket != null) socket.close(); } catch (IOException ignored) {}
        outputStream = null;
        socket = null;
        connectedDeviceName = null;
    }

    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ActivityCompat.checkSelfPermission(getActivity(),
                Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }
}
