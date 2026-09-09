import Phaser from "phaser";

/**
 * Local-only face picker: reads an image via FileReader and registers it as a
 * Phaser texture. The file never leaves the device.
 */
export class FaceUpload {
  private input: HTMLInputElement;
  private counter = 0;

  constructor(private scene: Phaser.Scene) {
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.accept = "image/*";
    this.input.style.display = "none";
    document.body.appendChild(this.input);
  }

  pick(): Promise<string | null> {
    return new Promise((resolve) => {
      this.input.value = "";
      const onChange = (): void => {
        this.input.removeEventListener("change", onChange);
        const file = this.input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const key = `faceTex_${this.counter++}`;
            if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
            this.scene.textures.addImage(key, img);
            resolve(key);
          };
          img.onerror = () => resolve(null);
          img.src = String(reader.result);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      this.input.addEventListener("change", onChange);
      this.input.click();
    });
  }

  destroy(): void {
    this.input.remove();
  }
}
