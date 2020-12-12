import {IInputs, IOutputs} from "./generated/ManifestTypes";
import * as $ from "jquery";

export class AdresseAPI implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private _context: ComponentFramework.Context<IInputs>;

    public _notifyOutputChanged: () => void;

    public inputElement: HTMLInputElement;

    private listElement: HTMLDivElement;

    private _container: HTMLDivElement;

    private _value: string;

    private _address_line_1: string;
    
    private _city: string;

    private _postcode: string;
    
    private _name: string;

    private _currentSelectedItem : number;

    private elementHover : boolean;    
	
	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._currentSelectedItem = -1;
        this.elementHover = false;
		
		if (this._context.parameters.address_line_1.raw) 
			this._address_line_1 = this._context.parameters.address_line_1.raw;
        
        if(this._context.parameters.address_line_1.attributes?.LogicalName)
            this._name = this._context.parameters.address_line_1.attributes?.LogicalName;
        else
            this._name = "";
            
        this._value = this._address_line_1;

        this.listElement = document.createElement("div");
        this.listElement.setAttribute("id", this._name +"_adresseList" );
        this.listElement.setAttribute("class", "autocomplete-items");

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("id", this._name +"_search_field");
        this.inputElement.setAttribute("type", "text");
        this.inputElement.setAttribute("class", "InputAddress");
        //this.inputElement.setAttribute("value", "");
        if(this._address_line_1 != "" && this._address_line_1 != undefined)
            this.inputElement.value = this._address_line_1;
        else
            this._address_line_1 = "---" ;
        this.inputElement.addEventListener("keyup", this.onKeyUp.bind(this));


        this.inputElement.addEventListener("focusin", () => {
            this.inputElement.className = "InputAddressFocused";
            if (this.inputElement.value == "---") this.inputElement.value = "";
        });
        this.inputElement.addEventListener("focusout", () => {
            this.inputElement.className = "InputAddress";
            if (this.inputElement.value == "") this.inputElement.value = "---";
        });      

        container.addEventListener("focusout", () => {
            if(!this.elementHover){
                this.listElement.hidden = true;
                this._address_line_1 = this.inputElement.value;
                if(this._address_line_1 != "")
                    this._notifyOutputChanged();
            }
        });
        
        container.appendChild(this.inputElement);
        container.appendChild(this.listElement);

        document.addEventListener('keydown', (event) => {
			// if(document.activeElement && document.activeElement.id != this.listElement.id)
				//this.listElement.hidden = true; 
            if(event.key == 'Escape' || (event.key == 'Enter' && this._currentSelectedItem == -1) )
            {
                this.listElement.hidden = true;
                this._address_line_1 = this.inputElement.value;

                if(this._address_line_1 != "")
                    this._notifyOutputChanged();
            }
			//keyCode = 27 et 13
				
		});
        
        $(document).bind('IssuesReceived', this.selectValue.bind(this));
	}


	private onKeyUp(event: KeyboardEvent): void {

        
		if (event.key == 'ArrowDown' || event.key == 'ArrowUp')
		{
			event.key == 'ArrowDown' ? this.navigateOptions(true) : this.navigateOptions(false);
			return;
			//navigateOptions
		}

		//event.key == 'Enter' || 
		if (event.key == 'Enter' && this._currentSelectedItem != -1){
			this.selectOption(this._currentSelectedItem);
			return;
		}
			

        if (event.key == 'Escape')
        {
            this._address_line_1 = this.inputElement.value;
            if(this._address_line_1 != "")
                this._notifyOutputChanged();
            return;
        }
            

        this._value = this.inputElement.value;
        var url = 'https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(this._value);
        var key: any;
        var self = this;
        $.getJSON(
            url
        ).done(function (info) {

            if (info && info.features) {


                (<HTMLDivElement>document.getElementById(self._name +"_adresseList" )).innerHTML = "";
                (<HTMLDivElement>document.getElementById(self._name +"_adresseList" )).hidden = false;

                for (key in info.features) {

                    if (info.features[key]) {

                        let newDiv: HTMLDivElement;
                        newDiv = document.createElement("div");
                        newDiv.textContent = info.features[key].properties.label;
                        newDiv.addEventListener("click", function () {
                            /*insert the value for the autocomplete text field:*/
                            (<HTMLInputElement>document.getElementById(self._name +"_search_field")).value = this.getElementsByTagName("input")[0].value;                       
                            (<HTMLDivElement>document.getElementById(self._name +"_adresseList" )).innerHTML = this.getElementsByTagName("input")[0].id;
                            (<HTMLDivElement>document.getElementById(self._name +"_adresseList" )).hidden = true;
                            //divAdresseList.innerHTML = this.getElementsByTagName("input")[0].id;
                            //divAdresseList.hidden = true;
                            $(document).trigger('IssuesReceived');

                        });
                        newDiv.addEventListener("mouseover", function () {self.elementHover = true;})
                        newDiv.addEventListener("mouseout", function () {self.elementHover = false;})
                        let newOptionTest: HTMLInputElement;
                        newOptionTest = document.createElement("input");
                        newOptionTest.setAttribute("type", "hidden");
                        newOptionTest.setAttribute("value", info.features[key].properties.label);
                        newOptionTest.setAttribute("id", info.features[key].properties.name + "_" + info.features[key].properties.city + "_" + info.features[key].properties.postcode);
                        newDiv.appendChild(newOptionTest);
                        //divAdresseList.appendChild(newDiv);
                        (<HTMLDivElement>document.getElementById(self._name +"_adresseList" )).appendChild(newDiv);

                    }

                }


            }
        });
    }


    public selectValue(): void {
        let data = (<HTMLDataListElement>document.getElementById(this._name +"_adresseList" )).innerHTML;
        if (!data.startsWith("<div")) {
            let dataArray = data.split('_');
            if (dataArray.length = 3) {
                if(dataArray[0] != "")
                {
                    this._value = dataArray[0];
                    this._address_line_1 = dataArray[0];
                    this.inputElement.value = dataArray[0];
                    this._city = dataArray[1];
                    this._postcode = dataArray[2];
                    this._notifyOutputChanged();
                }
                
            }
        }        
    }

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        this._context = context;
        if(this._value != "" && this._value != undefined)
            this.inputElement.value = this._value;
        else
            this.inputElement.value = "---" ;
            
        // this.inputElement.value = this._value;
        this._container.appendChild(this.inputElement);
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
    {
        return {
            address_line_1: this._address_line_1,
            city: this._city,
            postcode: this._postcode
        }
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
    }
    
    private navigateOptions(down : boolean)
	{
		if(this.listElement.hidden == true)
			return;

		var options = this.listElement.childNodes;
		if(down){
			if(this._currentSelectedItem == -1){
				(<HTMLInputElement>options[0]).style.backgroundColor =  "#e9e9e9" ;
				this._currentSelectedItem= 0;
			}
			else if(this._currentSelectedItem != options.length-1)
			{
				 (<HTMLInputElement>options[this._currentSelectedItem]).style.backgroundColor =  "#fff" ;
				 (<HTMLInputElement>options[this._currentSelectedItem+1]).style.backgroundColor =  "#e9e9e9" ;
				 this._currentSelectedItem++;
			}
		}else{
			if(this._currentSelectedItem == -1){
				(<HTMLInputElement>options[options.length-1]).style.backgroundColor =  "#e9e9e9" ;
				this._currentSelectedItem= options.length-1;
			}
			else if(this._currentSelectedItem != 0){
				(<HTMLInputElement>options[this._currentSelectedItem]).style.backgroundColor =  "#fff" ;
				(<HTMLInputElement>options[this._currentSelectedItem-1]).style.backgroundColor =  "#e9e9e9" ;
				this._currentSelectedItem--;
			}
		}

 	}


	private selectOption(index : number) : void{
		if(this.listElement.hidden == true)
		return;

		var options = this.listElement.childNodes;

		if(index >= 0 && index < options.length)
		{
			var tempValue = (<HTMLInputElement>(<HTMLInputElement>options[index]).childNodes[1]).value;
			var tempID =(<HTMLInputElement>(<HTMLInputElement>options[index]).childNodes[1]).id;
			this.inputElement.value = tempValue;
			this.listElement.innerHTML = tempID;
			this.listElement.hidden = true;
			this._currentSelectedItem == -1
			this.selectValue();
		}

    }
    
}