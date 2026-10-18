package id.zakystore.app;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Meminta runtime permission Bluetooth (SCAN + CONNECT) di Android 12+.
 * Web Bluetooth di WebView tidak bisa jalan tanpa izin ini, dan Capacitor
 * tidak memintanya otomatis — jadi diekspos sebagai plugin kecil yang
 * dipanggil dari JS sebelum navigator.bluetooth.requestDevice().
 */
@CapacitorPlugin(
    name = "BluetoothPermission",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_SCAN }, alias = "scan"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "connect")
    }
)
public class BluetoothPermissionPlugin extends Plugin {

    private JSObject buildResult() {
        boolean scanGranted = getPermissionState("scan") == PermissionState.GRANTED;
        boolean connectGranted = getPermissionState("connect") == PermissionState.GRANTED;
        // Di bawah Android 12 tidak ada runtime permission Bluetooth baru —
        // dianggap granted selama permission lama ada di manifest.
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.S
            || (scanGranted && connectGranted);
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("scan", scanGranted);
        ret.put("connect", connectGranted);
        return ret;
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(buildResult());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            call.resolve(buildResult());
            return;
        }
        requestPermissionForAliases(new String[]{"scan", "connect"}, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        call.resolve(buildResult());
    }
}
